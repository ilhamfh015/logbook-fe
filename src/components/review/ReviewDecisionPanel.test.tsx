import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReviewDecisionPanel } from "@/components/review/ReviewDecisionPanel";
import { ApiError } from "@/services/apiClient";
import { approveCorrection, approveDailyLog, rejectDailyLog } from "@/services/reviewService";
import type { AuthUser } from "@/types/auth";
import type { ReviewDailyLog } from "@/types/review";

const authState = vi.hoisted(() => ({ user: null as AuthUser | null }));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ user: authState.user }),
}));

vi.mock("@/services/reviewService", () => ({
  approveCorrection: vi.fn(),
  approveDailyLog: vi.fn(),
  rejectDailyLog: vi.fn(),
}));

const log: ReviewDailyLog = {
  id: 12,
  userId: 20,
  talentName: "Rina",
  talentJenis: "PKL",
  supervisorName: "Budi",
  supervisorEmail: null,
  logDate: "2026-11-25",
  status: "Menunggu",
  submittedAt: null,
  autoSubmitted: false,
  rejectionReason: null,
  revisionReason: null,
  decidedByName: null,
  decidedAt: null,
  totalDurationMinutes: 60,
  tasks: [],
};

function makeUser(): AuthUser {
  return {
    id: 10,
    email: "reviewer@example.test",
    fullName: "Reviewer",
    jenis: null,
    emailAtasan: null,
    admin: false,
    mustChangePassword: false,
    roles: ["ATASAN"],
  };
}

function renderPanel(currentLog = log) {
  const onUpdated = vi.fn();
  const onReload = vi.fn();
  render(<ReviewDecisionPanel log={currentLog} onUpdated={onUpdated} onReload={onReload} />);
  return { onUpdated, onReload };
}

async function openApproveDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /^Setujui$/ }));
  return screen.getByRole("alertdialog");
}

beforeEach(() => {
  authState.user = makeUser();
  vi.mocked(approveCorrection).mockReset();
  vi.mocked(approveDailyLog).mockReset();
  vi.mocked(rejectDailyLog).mockReset();
});

describe("ReviewDecisionPanel", () => {
  it.each([
    ["kosong", "", "Alasan penolakan wajib diisi."],
    ["spasi saja", "   \t  ", "Alasan penolakan wajib diisi."],
    ["lebih dari 1000 karakter", "a".repeat(1001), "Alasan penolakan paling banyak 1000 karakter."],
  ])("menolak alasan %s sebelum mengirim", async (_label, reason, message) => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Tolak dengan alasan" }));
    fireEvent.change(screen.getByLabelText(/Alasan penolakan/), { target: { value: reason } });
    await user.click(screen.getByRole("button", { name: "Kirim penolakan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(rejectDailyLog).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Alasan penolakan/)).toHaveValue(reason);
  });

  it("menjaga alasan dan menampilkan message serta fieldErrors dari 400 di form penolakan", async () => {
    const user = userEvent.setup();
    vi.mocked(rejectDailyLog).mockRejectedValue(new ApiError(
      400,
      "Alasan tidak valid dari server.",
      { reason: "Alasan terlalu singkat." },
    ));
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Tolak dengan alasan" }));
    const textarea = screen.getByLabelText(/Alasan penolakan/);
    await user.type(textarea, "Mohon lengkapi ringkasan pekerjaan.");
    await user.click(screen.getByRole("button", { name: "Kirim penolakan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Alasan tidak valid dari server.");
    expect(screen.getByRole("alert")).toHaveTextContent("Alasan terlalu singkat.");
    expect(textarea).toHaveValue("Mohon lengkapi ringkasan pekerjaan.");
    expect(screen.getByRole("button", { name: "Kirim penolakan" })).toBeInTheDocument();
  });

  it.each([
    [403, "Anda tidak berhak memutuskan Daily Log ini."],
    [404, "Keputusan belum dapat disimpan. Silakan coba lagi."],
    [500, "Keputusan belum dapat disimpan. Silakan coba lagi."],
  ])("menampilkan pesan netral untuk HTTP %i tanpa menutup dialog", async (status, message) => {
    const user = userEvent.setup();
    vi.mocked(approveDailyLog).mockRejectedValue(new ApiError(status, "teks teknis mentah"));
    renderPanel();
    const dialog = await openApproveDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Setujui" }));

    expect(await within(screen.getByRole("alertdialog")).findByRole("alert")).toHaveTextContent(message);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.queryByText("teks teknis mentah")).not.toBeInTheDocument();
  });

  it("menampilkan pesan 400 beserta fieldErrors di dialog dan membiarkannya terbuka", async () => {
    const user = userEvent.setup();
    vi.mocked(approveDailyLog).mockRejectedValue(new ApiError(
      400,
      "Permintaan keputusan tidak valid.",
      { status: "Status tidak valid." },
    ));
    renderPanel();
    const dialog = await openApproveDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Setujui" }));

    const alert = await within(screen.getByRole("alertdialog")).findByRole("alert");
    expect(alert).toHaveTextContent("Permintaan keputusan tidak valid.");
    expect(alert).toHaveTextContent("Status tidak valid.");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("menutup dialog kedaluwarsa, menampilkan pesan 409, dan memuat ulang data", async () => {
    const user = userEvent.setup();
    const { onReload } = renderPanel();
    vi.mocked(approveDailyLog).mockRejectedValue(new ApiError(409, "pesan teknis"));
    const dialog = await openApproveDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Setujui" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Status Daily Log sudah berubah. Data dimuat ulang.",
    );
    expect(onReload).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("memperbarui layar dengan hasil sukses dan menutup dialog", async () => {
    const user = userEvent.setup();
    const updatedLog = { ...log, status: "Disetujui" as const };
    const { onUpdated } = renderPanel();
    vi.mocked(approveDailyLog).mockResolvedValue(updatedLog);
    const dialog = await openApproveDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Setujui" }));

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updatedLog));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(await screen.findByRole("status")).toHaveTextContent("Daily Log disetujui.");
  });

  it("menampilkan status Draf dari respons saat perbaikan disetujui", async () => {
    const user = userEvent.setup();
    const updatedLog = { ...log, status: "Draf" as const };
    const { onUpdated } = renderPanel({ ...log, status: "Perbaikan diajukan" });
    vi.mocked(approveCorrection).mockResolvedValue(updatedLog);
    await user.click(screen.getByRole("button", { name: "Setujui perbaikan" }));
    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Setujui" }));

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updatedLog));
    expect(screen.queryByRole("button", { name: "Tolak dengan alasan" })).not.toBeInTheDocument();
  });

  it("mengunci tombol selama permintaan berjalan", async () => {
    const user = userEvent.setup();
    let resolveDecision!: (value: ReviewDailyLog) => void;
    vi.mocked(approveDailyLog).mockReturnValue(new Promise((resolve) => {
      resolveDecision = resolve;
    }));
    renderPanel();
    const dialog = await openApproveDialog(user);
    const confirmButton = within(dialog).getByRole("button", { name: "Setujui" });
    await user.click(confirmButton);

    expect(confirmButton).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Setujui$/ })).toBeDisabled();
    resolveDecision({ ...log, status: "Disetujui" });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("menampilkan pesan netral tanpa aksi saat id Daily Log null", () => {
    renderPanel({ ...log, id: null });

    expect(screen.getByText("Keputusan untuk tanggal ini belum dapat dilakukan dari halaman ini.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Setujui$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tolak dengan alasan" })).not.toBeInTheDocument();
  });

  it("tidak menyediakan Tolak pada status Perbaikan diajukan", () => {
    renderPanel({ ...log, status: "Perbaikan diajukan" });

    expect(screen.getByRole("button", { name: "Setujui perbaikan" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tolak dengan alasan" })).not.toBeInTheDocument();
  });
});