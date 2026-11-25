import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "@/services/apiClient";
import { adminService } from "@/services/adminService";
import { getTeam } from "@/services/teamService";
import {
  approveCorrection,
  approveDailyLog,
  getTalentDailyLog,
  rejectDailyLog,
} from "@/services/reviewService";
import type { ReviewDailyLog } from "@/types/review";
import type { AdminDailyLogDto, DailyLogDecisionResponse, DayDto, TeamMemberDto } from "@/types/reviewApi";

vi.mock("@/services/apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/apiClient")>();
  return { ...actual, apiFetch: vi.fn() };
});

vi.mock("@/services/adminService", () => ({
  adminService: {
    getAdminDailyLogs: vi.fn(),
    decideDailyLog: vi.fn(),
  },
}));

vi.mock("@/services/teamService", () => ({ getTeam: vi.fn() }));

const mockedApiFetch = vi.mocked(apiFetch);
const mockedGetAdminDailyLogs = vi.mocked(adminService.getAdminDailyLogs);
const mockedDecideDailyLog = vi.mocked(adminService.decideDailyLog);
const mockedGetTeam = vi.mocked(getTeam);

const reviewLog: ReviewDailyLog = {
  id: 18,
  userId: 10,
  talentName: "Rina",
  talentJenis: "PKL",
  supervisorName: "Budi",
  supervisorEmail: "budi@example.test",
  logDate: "2026-11-24",
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

function dayDto(overrides: Partial<DayDto> = {}): DayDto {
  return {
    date: "2026-11-24",
    status: "MENUNGGU",
    totalMinutes: 60,
    tasks: [],
    ...overrides,
  };
}

function decisionResponse(
  status: string,
  overrides: Partial<DailyLogDecisionResponse> = {},
): DailyLogDecisionResponse {
  return {
    id: 18,
    userId: 10,
    logDate: "2026-11-24",
    status,
    submittedAt: null,
    rejectionReason: null,
    decidedByUserId: 4,
    decidedAt: "2026-11-25T01:00:00Z",
    autoSubmitted: false,
    totalDurationMinutes: 60,
    ...overrides,
  };
}

beforeEach(() => {
  vi.useRealTimers();
  mockedApiFetch.mockReset();
  mockedGetAdminDailyLogs.mockReset().mockResolvedValue([]);
  mockedDecideDailyLog.mockReset();
  mockedGetTeam.mockReset().mockResolvedValue([]);
});

describe("reviewService", () => {
  it("memetakan DayDto tanpa metadata tambahan dan mempertahankan status yang dikenal", async () => {
    mockedApiFetch.mockResolvedValue(dayDto({
      status: "MENUNGGU",
      tasks: [{ id: 7, project: "Proyek A", color: "teal", ticket: "LBK-7", startMinute: 540,
        durationMinutes: 60, type: "Implementasi", summary: "Mengerjakan fitur", workStatus: "Selesai" }],
    }));

    const result = await getTalentDailyLog(10, "2026-11-24");

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/team/10/days/2026-11-24");
    expect(result).toMatchObject({
      id: null,
      talentName: null,
      talentJenis: null,
      status: "Menunggu",
      totalDurationMinutes: 60,
    });
    expect(result.tasks[0]).toMatchObject({
      project: "Proyek A",
      projectColor: "teal",
      workStatus: "SELESAI",
      durationMinutes: 60,
    });
    expect(mockedGetAdminDailyLogs).not.toHaveBeenCalled();
    expect(mockedGetTeam).not.toHaveBeenCalled();
  });

  it("menggabungkan metadata admin tanpa menimpa field langsung dari DayDto", async () => {
    mockedApiFetch.mockResolvedValue(dayDto({
      dailyLogId: 21,
      fullName: "Nama dari hari",
      submittedAt: "2026-11-24T10:00:00Z",
      autoSubmitted: false,
    }));
    mockedGetAdminDailyLogs.mockResolvedValue([{
      id: 99,
      userId: 10,
      fullName: "Nama dari admin",
      jenis: "Magang",
      logDate: "2026-11-24",
      status: "DISETUJUI",
      submittedAt: "2026-11-24T11:00:00Z",
      rejectionReason: "Alasan admin",
      revisionReason: "Catatan revisi",
      decidedByUserId: 4,
      decidedAt: "2026-11-25T01:00:00Z",
      autoSubmitted: true,
    } satisfies AdminDailyLogDto]);

    const result = await getTalentDailyLog(10, "2026-11-24", true);

    expect(mockedGetAdminDailyLogs).toHaveBeenCalledWith({ date: "2026-11-24", userId: 10 });
    expect(result).toMatchObject({
      id: 21,
      talentName: "Nama dari hari",
      talentJenis: "Magang",
      submittedAt: "2026-11-24T10:00:00Z",
      autoSubmitted: false,
      rejectionReason: "Alasan admin",
      revisionReason: "Catatan revisi",
      decidedAt: "2026-11-25T01:00:00Z",
    });
  });

  it("menggabungkan nama, jenis, dan ID dari tim saat tanggal adalah hari ini", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-25T04:00:00Z"));
    mockedApiFetch.mockResolvedValue(dayDto({ date: "2026-11-25", totalMinutes: null }));
    mockedGetTeam.mockResolvedValue([{
      userId: 10,
      fullName: "Rina Tim",
      jenis: "PKL",
      dailyLogId: 31,
      status: "MENUNGGU",
      totalDurationMinutes: 90,
      pendingDays: 1,
    } satisfies TeamMemberDto]);

    const result = await getTalentDailyLog(10, "2026-11-25");

    expect(mockedGetTeam).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      id: 31,
      talentName: "Rina Tim",
      talentJenis: "PKL",
      totalDurationMinutes: 90,
    });
  });

  it("tetap menampilkan data utama ketika sumber sekunder gagal", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-25T04:00:00Z"));
    mockedApiFetch.mockResolvedValue(dayDto({ date: "2026-11-25" }));
    mockedGetAdminDailyLogs.mockRejectedValue(new ApiError(403, "Tidak dapat membaca daftar admin."));
    mockedGetTeam.mockResolvedValue([{
      userId: 10,
      fullName: "Nama tim",
      jenis: "Magang",
      dailyLogId: 33,
    }]);

    const result = await getTalentDailyLog(10, "2026-11-25", true);

    expect(result.talentName).toBe("Nama tim");
    expect(result.id).toBe(33);
    expect(result.status).toBe("Menunggu");
  });

  it("mempertahankan ID null bila tidak ada sumber yang mengetahuinya", async () => {
    mockedApiFetch.mockResolvedValue(dayDto({ dailyLogId: null }));

    const result = await getTalentDailyLog(10, "2026-11-24");

    expect(result.id).toBeNull();
  });

  it("memetakan kode status yang tidak dikenal menjadi null", async () => {
    mockedApiFetch.mockResolvedValue(dayDto({ status: "STATUS_BARU" }));

    const result = await getTalentDailyLog(10, "2026-11-24");

    expect(result.status).toBeNull();
  });

  it.each([
    ["status BELUM_MULAI", async () => {
      mockedApiFetch.mockResolvedValue(dayDto({ status: "BELUM_MULAI", tasks: [] }));
      await getTalentDailyLog(10, "2026-11-24");
    }],
    ["respons 404", async () => {
      mockedApiFetch.mockRejectedValue(new ApiError(404, "Data tidak ditemukan."));
      await getTalentDailyLog(10, "2026-11-24");
    }],
  ])("menghasilkan pesan netral untuk hari tanpa log (%s)", async (_label, request) => {
    await expect(request()).rejects.toMatchObject({
      status: 404,
      message: "Belum ada Daily Log untuk tanggal ini.",
    });
  });

  it("mengirim aksi approve dan memetakan respons terbaru", async () => {
    mockedDecideDailyLog.mockResolvedValue(decisionResponse("DISETUJUI"));

    const result = await approveDailyLog(reviewLog);

    expect(mockedDecideDailyLog).toHaveBeenCalledWith(18, "approve", undefined);
    expect(result.status).toBe("Disetujui");
    expect(result.decidedAt).toBe("2026-11-25T01:00:00Z");
  });

  it("mengirim alasan reject dan memetakan respons terbaru", async () => {
    mockedDecideDailyLog.mockResolvedValue(decisionResponse("DITOLAK", {
      rejectionReason: "Mohon lengkapi ringkasan.",
    }));

    const result = await rejectDailyLog(reviewLog, "Mohon lengkapi ringkasan.");

    expect(mockedDecideDailyLog).toHaveBeenCalledWith(18, "reject", "Mohon lengkapi ringkasan.");
    expect(result.status).toBe("Ditolak");
    expect(result.rejectionReason).toBe("Mohon lengkapi ringkasan.");
  });

  it("mengirim aksi approve-revision dan memetakan draf terbaru", async () => {
    mockedDecideDailyLog.mockResolvedValue(decisionResponse("DRAF"));

    const result = await approveCorrection(reviewLog);

    expect(mockedDecideDailyLog).toHaveBeenCalledWith(18, "approve-revision", undefined);
    expect(result.status).toBe("Draf");
  });

  it.each([
    ["approve", 400], ["approve", 403], ["approve", 409],
    ["reject", 400], ["reject", 403], ["reject", 409],
    ["approve-revision", 400], ["approve-revision", 403], ["approve-revision", 409],
  ] as const)("meneruskan galat %i dari aksi %s", async (action, status) => {
    const error = new ApiError(status, `Pesan BE ${status}`);
    mockedDecideDailyLog.mockRejectedValue(error);
    const request = action === "approve"
      ? approveDailyLog(reviewLog)
      : action === "reject"
        ? rejectDailyLog(reviewLog, "Alasan penolakan")
        : approveCorrection(reviewLog);

    await expect(request).rejects.toBe(error);
  });

  it("tidak mengirim keputusan bila ID Daily Log belum diketahui", async () => {
    const logWithoutId = { ...reviewLog, id: null };

    await expect(approveDailyLog(logWithoutId)).rejects.toMatchObject({ status: 404 });
    expect(mockedDecideDailyLog).not.toHaveBeenCalled();
  });
});