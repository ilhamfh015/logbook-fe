import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeamDashboard } from "@/components/atasan/TeamDashboard";
import { ApiError } from "@/services/apiClient";
import { getPendingDays, getTeam } from "@/services/teamService";

vi.mock("@/services/teamService", () => ({
  getTeam: vi.fn(),
  getPendingDays: vi.fn(),
}));

const mockedGetTeam = vi.mocked(getTeam);
const mockedGetPendingDays = vi.mocked(getPendingDays);

const teamResponse = [
  {
    userId: 27,
    fullName: "Rina Aulia",
    email: "rina@example.test",
    jenis: "PKL",
    date: "2026-11-17",
    dailyLogId: 73,
    status: "MENUNGGU",
    totalDurationMinutes: 420,
    pendingDays: 3,
  },
];

describe("TeamDashboard", () => {
  beforeEach(() => {
    mockedGetTeam.mockReset();
    mockedGetPendingDays.mockReset();
    mockedGetPendingDays.mockResolvedValue([]);
  });

  it("menampilkan loading lalu anggota dengan tautan aktif", async () => {
    let resolveTeam!: (result: typeof teamResponse) => void;
    mockedGetTeam.mockReturnValue(new Promise((resolve) => {
      resolveTeam = resolve;
    }));
    mockedGetPendingDays.mockResolvedValue([{
      userId: 27,
      dailyLogId: 73,
      date: "2026-11-17",
      totalDurationMinutes: 420,
      submittedAt: "2026-11-18T01:00:00Z",
      autoSubmitted: false,
    }]);

    render(<TeamDashboard />);

    expect(screen.getByRole("status")).toHaveTextContent("Memuat daftar tim...");
    resolveTeam(teamResponse);

    expect(await screen.findByText("Rina Aulia")).toBeInTheDocument();
    expect(screen.getByText("PKL")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Buka Daily Log Rina Aulia" })).toHaveAttribute("href", "/tim/27/2026-11-17");
    expect(screen.getByRole("link", { name: "Buka Daily Log Rina Aulia Sel 17 Nov · 7 j" })).toHaveAttribute(
      "href",
      "/tim/27/2026-11-17",
    );
  });

  it("menampilkan galat lalu mencoba ulang permintaan", async () => {
    const user = userEvent.setup();
    mockedGetTeam
      .mockRejectedValueOnce(new ApiError(403, "Anda tidak memiliki akses."))
      .mockResolvedValueOnce(teamResponse);

    render(<TeamDashboard />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Anda tidak memiliki akses.");
    await user.click(screen.getByRole("button", { name: "Coba lagi" }));

    await waitFor(() => expect(mockedGetTeam).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Rina Aulia")).toBeInTheDocument();
  });

  it("menampilkan keadaan kosong dan kontrol tanggal nonaktif tanpa teks demo", async () => {
    mockedGetTeam.mockResolvedValue([]);

    render(<TeamDashboard />);

    expect(await screen.findByText("Belum ada anggota tim.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hari sebelumnya" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hari berikutnya" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hari sebelumnya" })).toHaveAttribute(
      "title",
      "Daftar tim saat ini hanya untuk hari ini.",
    );
    expect(screen.queryByText(/Data demonstrasi/)).not.toBeInTheDocument();
  });

  it("menampilkan '-' jika API tidak memberi status cuti atau libur", async () => {
    mockedGetTeam.mockResolvedValue(teamResponse);

    render(<TeamDashboard />);

    await screen.findByText("Rina Aulia");
    const leaveCard = screen.getByText("Cuti atau libur hari ini").closest("article");
    expect(leaveCard).not.toBeNull();
    expect(within(leaveCard!).getByText("-")).toBeInTheDocument();
  });

  it("memakai label seluruh talent untuk tampilan admin", async () => {
    mockedGetTeam.mockResolvedValue(teamResponse);

    render(<TeamDashboard audience="admin" />);

    expect(await screen.findByText("Rina Aulia")).toBeInTheDocument();
    expect(
      screen.getByText("Seluruh talent yang tercatat dalam Log Book"),
    ).toBeInTheDocument();
    expect(screen.getByText("Total talent")).toBeInTheDocument();
    expect(screen.getByText("Ringkasan seluruh talent")).toBeInTheDocument();
    expect(mockedGetTeam).toHaveBeenCalledWith("ADMIN");
    expect(
      screen.getByRole("link", { name: "Buka Daily Log Rina Aulia" }),
    ).toHaveAttribute("href", "/admin/tim/27/2026-11-17");
  });

  it("meminta cakupan atasan secara default", async () => {
    mockedGetTeam.mockResolvedValue(teamResponse);

    render(<TeamDashboard />);

    await screen.findByText("Rina Aulia");
    expect(mockedGetTeam).toHaveBeenCalledWith("ATASAN");
  });

  it("menampilkan chip tertaut berurutan dengan tag otomatis dan jumlah dari daftar", async () => {
    mockedGetTeam.mockResolvedValue([
      ...teamResponse,
      { ...teamResponse[0], userId: 28, fullName: "Sari Aulia", status: "DRAF", pendingDays: 0 },
    ]);
    mockedGetPendingDays.mockResolvedValue([
      {
        userId: 27,
        dailyLogId: 74,
        date: "2026-11-09",
        totalDurationMinutes: 450,
        submittedAt: "2026-11-10T01:00:00Z",
        autoSubmitted: false,
      },
      {
        userId: 27,
        dailyLogId: 73,
        date: "2026-11-06",
        totalDurationMinutes: 480,
        submittedAt: "2026-11-07T01:00:00Z",
        autoSubmitted: true,
      },
      {
        userId: 28,
        dailyLogId: 75,
        date: "2026-11-24",
        totalDurationMinutes: null,
        submittedAt: "2026-11-25T01:00:00Z",
        autoSubmitted: false,
      },
    ]);

    render(<TeamDashboard />);

    expect(await screen.findByText("Rina Aulia")).toBeInTheDocument();
    expect(await screen.findByText("Jum 6 Nov · 8 j")).toBeInTheDocument();
    expect(screen.getByText("Sen 9 Nov · 7 j 30 m")).toBeInTheDocument();
    expect(screen.getByText("Sel 24 Nov")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Buka Daily Log Rina Aulia Jum 6 Nov · 8 j" })).toHaveAttribute(
      "href",
      "/tim/27/2026-11-06",
    );
    expect(screen.getAllByText("terkirim otomatis")).toHaveLength(1);
    expect(screen.getByText("Menunggu keputusan").closest("article")).toHaveTextContent("3 hari");
    expect(mockedGetPendingDays).toHaveBeenCalledWith();
  });

  it("menampilkan Tidak ada untuk anggota tanpa hari menunggu", async () => {
    mockedGetTeam.mockResolvedValue(teamResponse);
    mockedGetPendingDays.mockResolvedValue([]);

    render(<TeamDashboard />);

    expect(await screen.findByText("Rina Aulia")).toBeInTheDocument();
    expect(screen.getByText("Tidak ada")).toBeInTheDocument();
  });

  it("memakai fallback pendingDays dan pesan netral bila daftar gagal dimuat", async () => {
    mockedGetTeam.mockResolvedValue(teamResponse);
    mockedGetPendingDays.mockRejectedValue(new ApiError(403, "Tidak memiliki akses."));

    render(<TeamDashboard />);

    expect(await screen.findByText("Rina Aulia")).toBeInTheDocument();
    expect(screen.getByText("Daftar hari menunggu belum dapat dimuat.")).toBeInTheDocument();
    expect(screen.getByText("Menunggu keputusan").closest("article")).toHaveTextContent("3 hari");
    expect(screen.getByText("2 hari menunggu")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
