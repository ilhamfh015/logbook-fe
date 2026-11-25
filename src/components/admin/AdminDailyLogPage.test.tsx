import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminDailyLogPage } from "@/components/admin/AdminDailyLogPage";
import { ApiError } from "@/services/apiClient";
import { adminService } from "@/services/adminService";
import type {
  AdminDailyLogDto,
  DailyLogDecisionResponse,
  DayDto,
} from "@/types/reviewApi";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: { fullName: "Admin", email: "admin@contoh.id", roles: ["ADMIN"] },
    loading: false,
  }),
}));

vi.mock("@/services/adminService", () => ({
  adminService: {
    getTalentOptions: vi.fn(),
    getAdminDailyLogs: vi.fn(),
    getTalentDailyLog: vi.fn(),
    decideDailyLog: vi.fn(),
  },
}));

const pendingLog: AdminDailyLogDto = {
  id: 1,
  userId: 10,
  fullName: "Rina Talent",
  email: "rina@contoh.id",
  jenis: "Magang",
  logDate: "2026-11-25",
  status: "MENUNGGU",
  submittedAt: "2026-11-25T17:00:00Z",
  rejectionReason: null,
  revisionReason: null,
  decidedByUserId: null,
  decidedAt: null,
  autoSubmitted: false,
  taskCount: 2,
  totalDurationMinutes: 90,
};

const approvedLog: AdminDailyLogDto = {
  ...pendingLog,
  id: 2,
  userId: 11,
  fullName: "Budi Talent",
  email: "budi@contoh.id",
  logDate: "2026-11-24",
  status: "DISETUJUI",
  decidedByUserId: 1,
  decidedAt: "2026-11-24T09:00:00Z",
};

const revisionLog: AdminDailyLogDto = {
  ...pendingLog,
  id: 3,
  userId: 12,
  fullName: "Sari Talent",
  email: "sari@contoh.id",
  logDate: "2026-11-23",
  status: "PERBAIKAN_DIAJUKAN",
  revisionReason: "Tambah task rapat",
};

const talentDay: DayDto = {
  date: "2026-11-25",
  status: "MENUNGGU",
  statusLabel: "Menunggu",
  totalMinutes: 90,
  tasks: [
    {
      id: 1,
      project: "Magang",
      color: "blue",
      ticket: "LB-1",
      startMinute: 480,
      durationMinutes: 40,
      type: "Rapat",
      summary: "Rapat mingguan",
      workStatus: "Selesai",
    },
    {
      id: 2,
      project: "Magang",
      color: "blue",
      ticket: "LB-2",
      startMinute: 540,
      durationMinutes: 50,
      type: "Implementasi",
      summary: "Mengerjakan fitur persetujuan",
      workStatus: "Berjalan",
    },
  ],
};

const decisionResponse: DailyLogDecisionResponse = {
  id: 1,
  userId: 10,
  logDate: "2026-11-25",
  status: "DISETUJUI",
  submittedAt: "2026-11-25T17:00:00Z",
  rejectionReason: null,
  decidedByUserId: 1,
  decidedAt: "2026-11-25T18:00:00Z",
  autoSubmitted: false,
  totalDurationMinutes: 90,
};

describe("AdminDailyLogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminService.getTalentOptions).mockResolvedValue([
      { id: 10, full_name: "Rina Talent" },
      { id: 11, full_name: "Budi Talent" },
      { id: 12, full_name: "Sari Talent" },
    ]);
    vi.mocked(adminService.getAdminDailyLogs).mockResolvedValue([
      pendingLog,
      approvedLog,
      revisionLog,
    ]);
    vi.mocked(adminService.getTalentDailyLog).mockResolvedValue(talentDay);
    vi.mocked(adminService.decideDailyLog).mockResolvedValue(decisionResponse);
  });

  it("menampilkan daftar dan label status dari API", async () => {
    render(<AdminDailyLogPage />);

    const table = await screen.findByRole("table");
    expect(await within(table).findByText("Rina Talent")).toBeInTheDocument();
    expect(within(table).getByText("Menunggu")).toBeInTheDocument();
    expect(within(table).getByText("Disetujui")).toBeInTheDocument();
    expect(within(table).getByText("Perbaikan diajukan")).toBeInTheDocument();
    expect(adminService.getAdminDailyLogs).toHaveBeenCalledWith({});
    expect(
      screen.queryByRole("button", { name: /Setujui Daily Log Budi Talent/ }),
    ).not.toBeInTheDocument();
  });

  it("mengirim filter tanggal, talent, dan status ke API", async () => {
    const user = userEvent.setup();
    render(<AdminDailyLogPage />);

    const table = await screen.findByRole("table");
    await within(table).findByText("Rina Talent");
    fireEvent.change(screen.getByLabelText("Tanggal"), {
      target: { value: "2026-11-25" },
    });
    await user.selectOptions(screen.getByLabelText("Talent"), "10");
    await user.selectOptions(screen.getByLabelText("Status"), "MENUNGGU");
    await user.click(screen.getByRole("button", { name: "Terapkan" }));

    await waitFor(() => {
      expect(adminService.getAdminDailyLogs).toHaveBeenLastCalledWith({
        date: "2026-11-25",
        userId: "10",
        status: "MENUNGGU",
      });
    });
  });

  it("menyetujui Daily Log berstatus Menunggu", async () => {
    const user = userEvent.setup();
    render(<AdminDailyLogPage />);

    await user.click(
      await screen.findByRole("button", {
        name: /Setujui Daily Log Rina Talent/,
      }),
    );

    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Setujui" }));

    await waitFor(() => {
      expect(adminService.decideDailyLog).toHaveBeenCalledWith(
        1,
        "approve",
        undefined,
      );
    });
    expect(
      await screen.findByText("Daily Log berhasil disetujui."),
    ).toBeInTheDocument();
  });

  it("mewajibkan alasan sebelum menolak Daily Log", async () => {
    const user = userEvent.setup();
    render(<AdminDailyLogPage />);

    await user.click(
      await screen.findByRole("button", { name: /Tolak Daily Log Rina Talent/ }),
    );

    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Tolak" }));
    expect(
      within(dialog).getByText("Alasan penolakan wajib diisi."),
    ).toBeInTheDocument();
    expect(adminService.decideDailyLog).not.toHaveBeenCalled();

    await user.type(
      within(dialog).getByLabelText(/Alasan penolakan/),
      "Ringkasan kurang rinci",
    );

    // Mengetik alasan tidak boleh mengirim keputusan sebelum tombol ditekan.
    expect(adminService.decideDailyLog).not.toHaveBeenCalled();
    expect(within(dialog).getByRole("textbox")).toHaveValue(
      "Ringkasan kurang rinci",
    );

    await user.click(within(dialog).getByRole("button", { name: "Tolak" }));

    await waitFor(() => {
      expect(adminService.decideDailyLog).toHaveBeenCalledWith(
        1,
        "reject",
        "Ringkasan kurang rinci",
      );
    });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("menyetujui revisi Daily Log berstatus Perbaikan diajukan", async () => {
    const user = userEvent.setup();
    render(<AdminDailyLogPage />);

    await user.click(
      await screen.findByRole("button", {
        name: /Setujui revisi Daily Log Sari Talent/,
      }),
    );

    const dialog = screen.getByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Setujui revisi" }),
    );

    await waitFor(() => {
      expect(adminService.decideDailyLog).toHaveBeenCalledWith(
        3,
        "approve-revision",
        undefined,
      );
    });
    expect(
      await screen.findByText("Revisi berhasil disetujui."),
    ).toBeInTheDocument();
  });

  it("menampilkan pesan API saat daftar gagal dimuat", async () => {
    vi.mocked(adminService.getAdminDailyLogs).mockRejectedValue(
      new ApiError(500, "Server sedang sibuk."),
    );
    render(<AdminDailyLogPage />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Server sedang sibuk.");
    expect(
      within(alert).getByRole("button", { name: "Coba lagi" }),
    ).toBeInTheDocument();
  });

  it("menampilkan detail Daily Log talent secara hanya baca", async () => {
    const user = userEvent.setup();
    render(<AdminDailyLogPage />);

    await user.click(
      await screen.findByRole("button", {
        name: /Lihat Daily Log Rina Talent/,
      }),
    );

    const panel = await screen.findByRole("dialog", {
      name: /Detail Daily Log Rina Talent/,
    });
    expect(adminService.getTalentDailyLog).toHaveBeenCalledWith(
      10,
      "2026-11-25",
    );
    expect(within(panel).getByText("Hanya baca")).toBeInTheDocument();
    expect(await within(panel).findByText("Rapat mingguan")).toBeInTheDocument();
    expect(
      within(panel).getByText("Mengerjakan fitur persetujuan"),
    ).toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "Tutup detail" }));
    expect(
      screen.queryByRole("dialog", { name: /Detail Daily Log Rina Talent/ }),
    ).not.toBeInTheDocument();
  });

  it("menampilkan pesan API saat detail Daily Log gagal dimuat", async () => {
    vi.mocked(adminService.getTalentDailyLog).mockRejectedValue(
      new ApiError(403, "Anda tidak memiliki akses."),
    );
    const user = userEvent.setup();
    render(<AdminDailyLogPage />);

    await user.click(
      await screen.findByRole("button", {
        name: /Lihat Daily Log Rina Talent/,
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Anda tidak memiliki akses.",
    );
  });
});
