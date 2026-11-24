import { formatClock } from "@/lib/taskTime";
import type { ReviewStatus } from "@/types/review";
import type { TaskDraft, WorkStatus } from "@/types/task";
import type { DayDto, DayTaskDto } from "@/types/reviewApi";

const statusLabels: Record<string, ReviewStatus> = {
  DRAF: "Draf",
  MENUNGGU: "Menunggu",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
  TERLEWAT: "Terlewat",
  PERBAIKAN_DIAJUKAN: "Perbaikan diajukan",
  DRAF_DIBUKA_KEMBALI: "Draf dibuka kembali",
};

export function statusFromCode(code: string | null | undefined): ReviewStatus | null {
  if (typeof code !== "string") return null;
  return statusLabels[code.trim().toUpperCase()] ?? null;
}

export function workStatusFromLabel(label: string | null | undefined): WorkStatus {
  const normalized = typeof label === "string" ? label.trim().toLowerCase() : "";
  if (normalized === "selesai") return "SELESAI";
  if (normalized === "berjalan") return "BERJALAN";
  if (normalized === "tertahan") return "TERTAHAN";
  // Label tak dikenal memakai status aktif agar task tetap tampil dan dapat ditindaklanjuti.
  return "BERJALAN";
}

export function taskFromDto(task: DayTaskDto | null | undefined): TaskDraft {
  const dto = task ?? {};
  const startMinute = finiteNumber(dto.startMinute) ? dto.startMinute : 0;
  const draft: TaskDraft = {
    project: dto.project ?? "",
    projectColor: dto.color ?? "blue",
    ticket: dto.ticket ?? "",
    startTime: formatClock(startMinute),
    startMinute,
    durationMinutes: finiteNumber(dto.durationMinutes) ? dto.durationMinutes : 0,
    type: dto.type ?? "",
    summary: dto.summary ?? "",
    obstacle: dto.obstacle ?? undefined,
    workStatus: workStatusFromLabel(dto.workStatus),
  };

  if (typeof dto.id === "number" && Number.isFinite(dto.id)) draft.id = String(dto.id);
  return draft;
}

export function tasksFromDay(day: DayDto | null | undefined): TaskDraft[] {
  const tasks = Array.isArray(day?.tasks) ? day.tasks : [];
  return tasks
    .map((task) => taskFromDto(task))
    .sort((left, right) => (left.startMinute ?? 0) - (right.startMinute ?? 0));
}

function finiteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}