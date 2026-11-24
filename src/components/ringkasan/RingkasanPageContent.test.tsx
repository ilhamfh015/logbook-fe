import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RingkasanPageContent } from "@/components/ringkasan/RingkasanPageContent";
import { ApiError } from "@/services/apiClient";
import { summaryService } from "@/services/summaryService";
import type { SummaryResponse } from "@/types/summary";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: { fullName: "Rina", email: "rina@contoh.id", roles: ["TALENT"] },
    loading: false,
  }),
}));

vi.mock("@/services/summaryService", () => ({
  summaryService: {
    getSummary: vi.fn(),
  },
}));

const summaryResponse: SummaryResponse = {
  totalMinutes: 510,
  daysRecorded: 2,
  workdays: 5,
  perType: [
    { name: "Development", minutes: 300 },
    { name: "Meeting", minutes: 210 },
  ],
  perProject: [{ name: "Logbook", color: "#0A6FD6", minutes: 510 }],
  done: [
    {
      date: "2026-11-24",
      taskId: 1,
      project: "Logbook",
      color: "#0A6FD6",
      ticket: "LBK-1",
      type: "Development",
      summary: "Implementasi halaman ringkasan",
      workStatus: "DONE",
      startMinute: 480,
      durationMinutes: 120,
    },
  ],
  ongoing: [
    {
      date: "2026-11-24",
      taskId: 2,
      project: "Logbook",
      color: "#0A6FD6",
      ticket: "LBK-2",
      type: "Meeting",
      summary: "Diskusi kebutuhan ringkasan",
      workStatus: "ON_PROGRESS",
      startMinute: 600,
      durationMinutes: 60,
    },
  ],
  obstacles: [
    {
      date: "2026-11-24",
      taskId: 3,
      project: "Logbook",
      ticket: "LBK-3",
      obstacle: "Menunggu akses data",
    },
  ],
  shortSummaryDays: [{ date: "2026-11-23", count: 1 }],
};

describe("RingkasanPageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(summaryService.getSummary).mockResolvedValue(summaryResponse);
  });

  it("memuat dan menampilkan rekap ringkasan", async () => {
    render(<RingkasanPageContent />);

    expect(screen.getByText("Memuat ringkasan...")).toBeInTheDocument();

    await waitFor(() => {
      expect(summaryService.getSummary).toHaveBeenCalled();
    });

    expect(await screen.findByText("Ringkasanku")).toBeInTheDocument();
    expect(screen.getAllByText("8 jam 30 menit").length).toBeGreaterThan(0);
    expect(screen.getByText("2 hari")).toBeInTheDocument();
    expect(screen.getByText("5 hari")).toBeInTheDocument();
    expect(screen.getByText("Implementasi halaman ringkasan")).toBeInTheDocument();
    expect(screen.getByText("Diskusi kebutuhan ringkasan")).toBeInTheDocument();
    expect(screen.getByText("Menunggu akses data")).toBeInTheDocument();
    expect(screen.getByText("1 task")).toBeInTheDocument();
  });

  it("mengganti periode dan memuat ulang data", async () => {
    const user = userEvent.setup();
    render(<RingkasanPageContent />);

    await screen.findByText("Ringkasanku");
    await user.click(screen.getByRole("button", { name: "Bulanan" }));

    await waitFor(() => {
      expect(summaryService.getSummary).toHaveBeenLastCalledWith(
        "MONTH",
        expect.any(String),
      );
    });
  });

  it("menampilkan pesan galat saat API gagal", async () => {
    vi.mocked(summaryService.getSummary).mockRejectedValue(new ApiError(500, "Server bermasalah"));

    render(<RingkasanPageContent />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Server bermasalah");
  });

  it("menampilkan keadaan kosong saat tidak ada data", async () => {
    vi.mocked(summaryService.getSummary).mockResolvedValue({
      totalMinutes: 0,
      daysRecorded: 0,
      workdays: 0,
      perType: [],
      perProject: [],
      done: [],
      ongoing: [],
      obstacles: [],
      shortSummaryDays: [],
    });

    render(<RingkasanPageContent />);

    expect(await screen.findByText("Belum ada data ringkasan")).toBeInTheDocument();
  });
});
