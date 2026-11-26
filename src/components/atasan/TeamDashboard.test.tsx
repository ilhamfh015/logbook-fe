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
type PendingDay = Awaited<ReturnType<typeof getPendingDays>>[number];

function mockPendingDays(waiting: PendingDay[] = [], repairs: PendingDay[] = []) {
  mockedGetPendingDays.mockImplementation(async (status) => (
    status === "PERBAIKAN_DIAJUKAN" ? repairs : waiting
  ));
}

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
    mockPendingDays();
  });

  it("menampilkan loading lalu anggota dengan tautan aktif", async () => {
    let resolveTeam!: (result: typeof teamResponse) => void;
    mockedGetTeam.mockReturnValue(new Promise((resolve) => {
      resolveTeam = resolve;
    }));
    mockPendingDays([{
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
    mockPendingDays([
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
    expect(mockedGetPendingDays).toHaveBeenCalledWith("PERBAIKAN_DIAJUKAN");
  });

  it("menampilkan Tidak ada untuk anggota tanpa hari menunggu", async () => {
    mockedGetTeam.mockResolvedValue(teamResponse);
    mockPendingDays();

    render(<TeamDashboard />);

    expect(await screen.findByText("Rina Aulia")).toBeInTheDocument();
    expect(screen.getByText("Tidak ada")).toBeInTheDocument();
  });

  it("memakai fallback pendingDays dan pesan netral bila daftar gagal dimuat", async () => {
    mockedGetTeam.mockResolvedValue(teamResponse);
    mockedGetPendingDays.mockImplementation(async (status) => {
      if (status === "PERBAIKAN_DIAJUKAN") return [];
      throw new ApiError(403, "Tidak memiliki akses.");
    });

    render(<TeamDashboard />);

    expect(await screen.findByText("Rina Aulia")).toBeInTheDocument();
    expect(screen.getByText("Daftar hari menunggu belum dapat dimuat.")).toBeInTheDocument();
    expect(screen.getByText("Menunggu keputusan").closest("article")).toHaveTextContent("3 hari");
    expect(screen.getByText("2 hari menunggu")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("menampilkan chip perbaikan dan menunggu berurutan dengan hitungan terpisah", async () => {
    mockedGetTeam.mockResolvedValue(teamResponse);
    mockPendingDays([{
      userId: 27,
      dailyLogId: 73,
      date: "2026-11-09",
      totalDurationMinutes: 450,
      submittedAt: "2026-11-10T01:00:00Z",
      autoSubmitted: true,
    }], [{
      userId: 27,
      dailyLogId: 74,
      date: "2026-11-06",
      totalDurationMinutes: 450,
      submittedAt: "2026-11-07T01:00:00Z",
      autoSubmitted: true,
    }]);

    render(<TeamDashboard />);

    expect(await screen.findByText("Rina Aulia")).toBeInTheDocument();
    const row = screen.getByText("Rina Aulia").closest("tr");
    expect(row).not.toBeNull();
    const pendingCell = within(row!).getAllByRole("cell")[3];
    const dayLinks = within(pendingCell).getAllByRole("link");

    expect(dayLinks.map((link) => link.getAttribute("href"))).toEqual([
      "/tim/27/2026-11-06",
      "/tim/27/2026-11-09",
    ]);
    expect(screen.getByRole("link", {
      name: "Buka perbaikan Daily Log Rina Aulia Jum 6 Nov · 7 j 30 m",
    })).toHaveClass("bg-cyan-100");
    expect(screen.getByText("Perbaikan diajukan", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByRole("link", {
      name: "Buka Daily Log Rina Aulia Sen 9 Nov · 7 j 30 m",
    })).toHaveClass("bg-slate-100");
    expect(screen.getAllByText("terkirim otomatis")).toHaveLength(2);
    expect(screen.getByText("Menunggu keputusan", { selector: "p" }).closest("article"))
      .toHaveTextContent("1 hari");
    expect(screen.getByText("Perbaikan diajukan", { selector: "p" }).closest("article"))
      .toHaveTextContent("1");
  });

  it("mempertahankan daftar menunggu dan memakai fallback perbaikan jika daftar perbaikan gagal", async () => {
    mockedGetTeam.mockResolvedValue([{
      ...teamResponse[0],
      status: "PERBAIKAN_DIAJUKAN",
    }]);
    mockedGetPendingDays.mockImplementation(async (status) => {
      if (status === "PERBAIKAN_DIAJUKAN") {
        throw new ApiError(404, "Tidak ditemukan.");
      }
      return [{
        userId: 27,
        dailyLogId: 75,
        date: "2026-11-09",
        totalDurationMinutes: 450,
        submittedAt: "2026-11-10T01:00:00Z",
        autoSubmitted: false,
      }];
    });

    render(<TeamDashboard />);

    expect(await screen.findByText("Rina Aulia")).toBeInTheDocument();
    expect(screen.getByText("Daftar perbaikan belum dapat dimuat.")).toBeInTheDocument();
    expect(screen.getByRole("link", {
      name: "Buka perbaikan Daily Log Rina Aulia Sel 17 Nov · 7 j",
    })).toHaveAttribute("href", "/tim/27/2026-11-17");
    expect(screen.getByRole("link", {
      name: "Buka Daily Log Rina Aulia Sen 9 Nov · 7 j 30 m",
    })).toBeInTheDocument();
    expect(screen.getByText("Perbaikan diajukan", { selector: "p" }).closest("article"))
      .toHaveTextContent("1");
  });

  it("mempertahankan daftar perbaikan dan memakai fallback menunggu jika daftar menunggu gagal", async () => {
    mockedGetTeam.mockResolvedValue([{
      ...teamResponse[0],
      status: "PERBAIKAN_DIAJUKAN",
      pendingDays: 3,
    }]);
    mockedGetPendingDays.mockImplementation(async (status) => {
      if (status === "PERBAIKAN_DIAJUKAN") {
        return [{
          userId: 27,
          dailyLogId: 76,
          date: "2026-11-06",
          totalDurationMinutes: null,
          submittedAt: "2026-11-07T01:00:00Z",
          autoSubmitted: false,
        }];
      }
      throw new ApiError(400, "Gagal memuat.");
    });

    render(<TeamDashboard />);

    expect(await screen.findByText("Rina Aulia")).toBeInTheDocument();
    expect(screen.getByText("Daftar hari menunggu belum dapat dimuat.")).toBeInTheDocument();
    expect(screen.getByText("3 hari menunggu")).toBeInTheDocument();
    expect(screen.getByRole("link", {
      name: "Buka perbaikan Daily Log Rina Aulia Jum 6 Nov",
    })).toHaveAttribute("href", "/tim/27/2026-11-06");
    expect(screen.getByText("Menunggu keputusan", { selector: "p" }).closest("article"))
      .toHaveTextContent("3 hari");
    expect(screen.getByText("Perbaikan diajukan", { selector: "p" }).closest("article"))
      .toHaveTextContent("1");
  });
});
