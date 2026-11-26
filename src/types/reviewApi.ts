import type { ApiTask, DayInfo } from "@/services/taskService";

/** Kode status dari endpoint hari, tim, admin, dan keputusan Daily Log. */
export type DailyLogStatusCode =
  | "DRAF"
  | "MENUNGGU"
  | "DISETUJUI"
  | "DITOLAK"
  | "TERLEWAT"
  | "PERBAIKAN_DIAJUKAN"
  | "DRAF_DIBUKA_KEMBALI"
  | "BELUM_MULAI";

/** DTO GET /api/team/{userId}/days/{date} dan GET /api/daily-logs/users/{userId}?date=. */
export type DayDto = {
  dailyLogId?: number | null;
  date?: string | null;
  fullName?: string | null;
  jenis?: string | null;
  status?: string | null;
  statusLabel?: string | null;
  editable?: boolean | null;
  deadline?: string | null;
  dayLabel?: "Libur" | "Cuti" | null;
  range?: { startMinute?: number | null; endMinute?: number | null } | null;
  totalMinutes?: number | null;
  perProject?: Array<{ name?: string | null; color?: string | null; minutes?: number | null } | null> | null;
  tasks?: Array<DayTaskDto | null> | null;
  rejectReason?: string | null;
  submittedAt?: string | null;
  autoSubmitted?: boolean | null;
  revisionReason?: string | null;
  decidedAt?: string | null;
  decidedByName?: string | null;
  decidedBy?: string | null;
};

/** Elemen tasks pada DTO GET /api/team/{userId}/days/{date}. */
export type DayTaskDto = {
  id?: number | null;
  project?: string | null;
  color?: string | null;
  ticket?: string | null;
  startMinute?: number | null;
  durationMinutes?: number | null;
  type?: string | null;
  summary?: string | null;
  workStatus?: string | null;
  obstacle?: string | null;
};

/** Elemen array GET /api/team. */
export type TeamMemberDto = {
  userId?: number | null;
  fullName?: string | null;
  email?: string | null;
  jenis?: string | null;
  date?: string | null;
  dailyLogId?: number | null;
  status?: string | null;
  totalDurationMinutes?: number | null;
  pendingDays?: number | null;
};

/** Elemen array GET /api/team/pending-days. */
export type TeamPendingDayDto = {
  userId?: number | null;
  dailyLogId?: number | null;
  date?: string | null;
  totalDurationMinutes?: number | null;
  submittedAt?: string | null;
  autoSubmitted?: boolean | null;
};

/** Elemen array GET /api/admin/daily-logs?date=&userId=&status=. */
export type AdminDailyLogDto = {
  id?: number | null;
  userId?: number | null;
  fullName?: string | null;
  email?: string | null;
  jenis?: string | null;
  logDate?: string | null;
  status?: string | null;
  submittedAt?: string | null;
  rejectionReason?: string | null;
  revisionReason?: string | null;
  decidedByUserId?: number | null;
  decidedAt?: string | null;
  autoSubmitted?: boolean | null;
  taskCount?: number | null;
  totalDurationMinutes?: number | null;
};

/** Respons POST approve, reject, dan approve-revision; field yang berbeda antarrespons opsional. */
export type DailyLogDecisionResponse = {
  id: number;
  userId: number;
  logDate: string;
  status: string;
  submittedAt: string | null;
  rejectionReason: string | null;
  revisionReason?: string | null;
  decidedByUserId: number | null;
  decidedAt: string | null;
  autoSubmitted: boolean;
  totalDurationMinutes: number;
  editable?: boolean;
  deadline?: string | null;
  day?: DayInfo | null;
  tasks?: ApiTask[] | null;
};