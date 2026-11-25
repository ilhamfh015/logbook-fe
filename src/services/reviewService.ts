import { reviewFixtures } from "@/lib/mocks/reviewFixtures";
import { statusFromCode, tasksFromDay } from "@/lib/reviewMapper";
import { validateRejectionReason } from "@/lib/reviewValidation";
import { ApiError, apiFetch } from "@/services/apiClient";
import { adminService } from "@/services/adminService";
import { getTeam } from "@/services/teamService";
import type { AdminDailyLogDto, DayDto, TeamMemberDto } from "@/types/reviewApi";
import type { ReviewDailyLog } from "@/types/review";

const USE_MOCK = process.env.NEXT_PUBLIC_REVIEW_USE_MOCK === "true";
const MOCK_LATENCY_MS = 300;
const mockLogs = new Map(
  reviewFixtures.map((log) => [getLogKey(log.userId, log.logDate), cloneLog(log)]),
);

export async function getTalentDailyLog(
  userId: string | number,
  dateIso: string,
  isAdmin = false,
): Promise<ReviewDailyLog> {
  if (USE_MOCK) {
    await waitForMockLatency();
    const log = mockLogs.get(getLogKey(userId, dateIso));
    if (!log) throw new ApiError(404, "Belum ada Daily Log untuk tanggal ini.");
    return cloneLog(log);
  }

  let day: DayDto;
  try {
    day = await apiFetch<DayDto>(
      `/api/team/${encodeURIComponent(String(userId))}/days/${encodeURIComponent(dateIso)}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError(404, "Belum ada Daily Log untuk tanggal ini.");
    }
    throw error;
  }

  if (normalizeCode(day.status) === "BELUM_MULAI") {
    throw new ApiError(404, "Belum ada Daily Log untuk tanggal ini.");
  }

  const [adminResult, teamResult] = await Promise.allSettled([
    isAdmin ? adminService.getAdminDailyLogs({ date: dateIso, userId }) : Promise.resolve([]),
    dateIso === dateInJakarta() ? getTeam() : Promise.resolve([]),
  ]);
  const adminLogs = adminResult.status === "fulfilled" ? adminResult.value : [];
  const teamMembers = teamResult.status === "fulfilled" ? teamResult.value : [];
  const adminLog = adminLogs.find((item) => matchesUser(item.userId, userId)
    && (!item.logDate || item.logDate === dateIso));
  const teamMember = teamMembers.find((item) => matchesUser(item.userId, userId));

  return mapDayToReview(day, userId, dateIso, adminLog, teamMember);
}

export async function approveDailyLog(log: ReviewDailyLog): Promise<ReviewDailyLog> {
  if (USE_MOCK) {
    await waitForMockLatency();
    const currentLog = findMockLog(log);
    ensureStatus(currentLog, "Menunggu");
    return saveLog({ ...currentLog, status: "Disetujui", decidedAt: new Date().toISOString() });
  }

  return decide(log, "approve");
}

export async function rejectDailyLog(
  log: ReviewDailyLog,
  reason: string,
): Promise<ReviewDailyLog> {
  if (USE_MOCK) {
    const validationMessage = validateRejectionReason(reason);
    if (validationMessage) {
      throw new ApiError(422, validationMessage, { rejectionReason: validationMessage });
    }

    await waitForMockLatency();
    const currentLog = findMockLog(log);
    ensureStatus(currentLog, "Menunggu");
    return saveLog({
      ...currentLog,
      status: "Ditolak",
      rejectionReason: reason.trim(),
      decidedAt: new Date().toISOString(),
    });
  }

  return decide(log, "reject", reason);
}

export async function approveCorrection(log: ReviewDailyLog): Promise<ReviewDailyLog> {
  if (USE_MOCK) {
    await waitForMockLatency();
    const currentLog = findMockLog(log);
    ensureStatus(currentLog, "Perbaikan diajukan");
    return saveLog({ ...currentLog, status: "Draf dibuka kembali", decidedAt: new Date().toISOString() });
  }

  return decide(log, "approve-revision");
}

async function decide(
  log: ReviewDailyLog,
  decision: "approve" | "reject" | "approve-revision",
  reason?: string,
): Promise<ReviewDailyLog> {
  if (log.id === null) throw new ApiError(404, "ID Daily Log belum tersedia.");

  const updated = await adminService.decideDailyLog(log.id, decision, reason);
  return {
    ...log,
    id: updated.id,
    userId: updated.userId,
    logDate: updated.logDate,
    status: statusFromCode(updated.status),
    submittedAt: updated.submittedAt,
    autoSubmitted: updated.autoSubmitted,
    rejectionReason: updated.rejectionReason,
    revisionReason: updated.revisionReason ?? log.revisionReason,
    decidedAt: updated.decidedAt,
    totalDurationMinutes: updated.totalDurationMinutes,
  };
}

function mapDayToReview(
  day: DayDto,
  userId: string | number,
  dateIso: string,
  adminLog: AdminDailyLogDto | undefined,
  teamMember: TeamMemberDto | undefined,
): ReviewDailyLog {
  const directStatus = firstValue(day.status, adminLog?.status, teamMember?.status);
  const dayId = firstValue(day.dailyLogId, adminLog?.id, teamMember?.dailyLogId);
  return {
    id: dayId ?? null,
    userId: Number(userId),
    talentName: firstValue(day.fullName, adminLog?.fullName, teamMember?.fullName) ?? null,
    talentJenis: firstValue(day.jenis, adminLog?.jenis, teamMember?.jenis) ?? null,
    supervisorName: null,
    supervisorEmail: null,
    logDate: firstValue(day.date, adminLog?.logDate) ?? dateIso,
    status: statusFromCode(directStatus),
    submittedAt: firstValue(day.submittedAt, adminLog?.submittedAt) ?? null,
    autoSubmitted: firstValue(day.autoSubmitted, adminLog?.autoSubmitted) ?? null,
    rejectionReason: firstValue(day.rejectReason, adminLog?.rejectionReason) ?? null,
    revisionReason: firstValue(day.revisionReason, adminLog?.revisionReason) ?? null,
    decidedByName: firstValue(day.decidedByName, day.decidedBy) ?? null,
    decidedAt: firstValue(day.decidedAt, adminLog?.decidedAt) ?? null,
    totalDurationMinutes: firstValue(
      day.totalMinutes,
      adminLog?.totalDurationMinutes,
      teamMember?.totalDurationMinutes,
    ) ?? null,
    tasks: tasksFromDay(day),
  };
}

function getLogKey(userId: string | number, dateIso: string): string {
  return `${userId}:${dateIso}`;
}

function cloneLog(log: ReviewDailyLog): ReviewDailyLog {
  return { ...log, tasks: log.tasks.map((task) => ({ ...task })) };
}

function findMockLog(log: ReviewDailyLog): ReviewDailyLog {
  const currentLog = mockLogs.get(getLogKey(log.userId, log.logDate));
  if (!currentLog) {
    throw new ApiError(404, "Daily Log tidak ditemukan.");
  }
  return currentLog;
}

function ensureStatus(log: ReviewDailyLog, expectedStatus: ReviewDailyLog["status"]): void {
  if (log.status !== expectedStatus) {
    throw new ApiError(409, "Daily Log ini belum bisa diputuskan.");
  }
}

function saveLog(log: ReviewDailyLog): ReviewDailyLog {
  mockLogs.set(getLogKey(log.userId, log.logDate), cloneLog(log));
  return cloneLog(log);
}

function waitForMockLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}

function normalizeCode(value: string | null | undefined): string {
  return value?.trim().toUpperCase() ?? "";
}

function matchesUser(candidate: number | null | undefined, userId: string | number): boolean {
  return candidate != null && String(candidate) === String(userId);
}

function firstValue<T>(...values: Array<T | null | undefined>): T | undefined {
  return values.find((value): value is T => value !== null && value !== undefined);
}

function dateInJakarta(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}