import { reviewFixtures } from "@/lib/mocks/reviewFixtures";
import { validateRejectionReason } from "@/lib/reviewValidation";
import { ApiError } from "@/services/apiClient";
import type { ReviewDailyLog } from "@/types/review";

const USE_MOCK = process.env.NEXT_PUBLIC_REVIEW_USE_MOCK !== "false";
const MOCK_LATENCY_MS = 300;
const mockLogs = new Map(
  reviewFixtures.map((log) => [getLogKey(log.userId, log.logDate), cloneLog(log)]),
);

export async function getTalentDailyLog(
  userId: string | number,
  dateIso: string,
): Promise<ReviewDailyLog> {
  if (!USE_MOCK) throwEndpointUnavailable();

  await waitForMockLatency();
  const log = mockLogs.get(getLogKey(userId, dateIso));
  if (!log) {
    throw new ApiError(404, "Daily Log tidak ditemukan.");
  }

  return cloneLog(log);
}

export async function approveDailyLog(log: ReviewDailyLog): Promise<ReviewDailyLog> {
  if (!USE_MOCK) throwEndpointUnavailable();

  await waitForMockLatency();
  const currentLog = findMockLog(log);
  ensureStatus(currentLog, "Menunggu");
  return saveLog({
    ...currentLog,
    status: "Disetujui",
    decidedAt: new Date().toISOString(),
  });
}

export async function rejectDailyLog(
  log: ReviewDailyLog,
  reason: string,
): Promise<ReviewDailyLog> {
  if (!USE_MOCK) throwEndpointUnavailable();

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

export async function approveCorrection(log: ReviewDailyLog): Promise<ReviewDailyLog> {
  if (!USE_MOCK) throwEndpointUnavailable();

  await waitForMockLatency();
  const currentLog = findMockLog(log);
  ensureStatus(currentLog, "Perbaikan diajukan");
  return saveLog({
    ...currentLog,
    status: "Draf dibuka kembali",
    decidedAt: new Date().toISOString(),
  });
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

function throwEndpointUnavailable(): never {
  // TODO jadwal baris 52: kontrak integrasi FE-BE C4 untuk GET Daily Log talent tim, setujui, tolak beralasan, dan setujui perbaikan.
  throw new Error("Endpoint belum tersedia: sambungkan pada integrasi FE-BE C4");
}