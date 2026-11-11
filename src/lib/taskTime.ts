import type { TaskDraft } from "@/types/task";

/** Jam mulai yang disarankan: 08:00 jika belum ada task, selain itu jam selesai task terakhir. */
export function nextStartTime(tasks: Array<Pick<TaskDraft, "startTime" | "durationMinutes">>) {
  if (tasks.length === 0) return "08:00";
  const endTimes = tasks
    .map((task) => toMinutes(task.startTime) + task.durationMinutes)
    .filter((value) => Number.isFinite(value));
  if (endTimes.length === 0) return "08:00";
  return formatClock(Math.max(...endTimes));
}

export function toMinutes(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return Number.NaN;
  return hours * 60 + minutes;
}

export function formatClock(totalMinutes: number, separator = ":") {
  const clamped = Math.min(Math.max(totalMinutes, 0), 23 * 60 + 59);
  const hours = String(Math.floor(clamped / 60)).padStart(2, "0");
  const minutes = String(clamped % 60).padStart(2, "0");
  return `${hours}${separator}${minutes}`;
}
