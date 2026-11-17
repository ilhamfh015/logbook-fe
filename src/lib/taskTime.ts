import type { TaskDraft } from "@/types/task";

export const MINUTES_PER_DAY = 1440;
/** Jam kerja normal dimulai pukul 08.00. */
export const WORKDAY_START_MINUTE = 8 * 60;
/** Jam kerja normal berakhir pukul 17.00. */
export const WORKDAY_END_MINUTE = 17 * 60;
/** Batas bagian dini hari: 00.00 sampai 08.00 pada hari berikutnya. */
export const EARLY_MORNING_END_MINUTE = WORKDAY_START_MINUTE;

type TimeSource = Pick<TaskDraft, "startMinute" | "startTime">;

export function toMinutes(time: string) {
  const [hours, minutes] = (time ?? "").slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return Number.NaN;
  return hours * 60 + minutes;
}

/**
 * Menit mulai absolut dihitung dari 00.00 tanggal Daily Log. Nilai >= 1440
 * berarti task dimulai setelah tengah malam tanggal berikutnya, sedangkan nilai
 * < 480 berarti task dimulai dini hari pada tanggal itu sendiri.
 */
export function resolveStartMinute(task: TimeSource): number {
  if (typeof task.startMinute === "number" && Number.isFinite(task.startMinute)) {
    return task.startMinute;
  }
  return toMinutes(task.startTime ?? "");
}

export function formatClock(totalMinutes: number, separator = ":") {
  const normalized = ((Math.round(totalMinutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = String(Math.floor(normalized / 60)).padStart(2, "0");
  const minutes = String(normalized % 60).padStart(2, "0");
  return `${hours}${separator}${minutes}`;
}

/** Label jam pada linimasa, mis. 480 -> "08.00" dan 1440 -> "24.00". */
export function formatHourLabel(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  return `${String(hours).padStart(2, "0")}.00`;
}

/**
 * Jam mulai yang disarankan untuk task berikutnya. `null` berarti task terakhir
 * berlanjut melewati tengah malam sehingga lanjutannya diisi pada tanggal
 * berikutnya.
 */
export function nextStartMinute(tasks: Array<Pick<TaskDraft, "startMinute" | "startTime" | "durationMinutes">>) {
  if (tasks.length === 0) return WORKDAY_START_MINUTE;
  const endTimes = tasks
    .map((task) => resolveStartMinute(task) + task.durationMinutes)
    .filter((value) => Number.isFinite(value));
  if (endTimes.length === 0) return WORKDAY_START_MINUTE;
  const latestEnd = Math.max(...endTimes);
  return latestEnd >= MINUTES_PER_DAY ? null : latestEnd;
}
