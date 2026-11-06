"use client";

import {
  ChevronLeft,
  ChevronRight,
  Coffee,
  Folder,
  Home,
  Info,
  Plus,
} from "lucide-react";
import { ProjectChip } from "@/components/shared/ProjectChip";
import type { ProjectColor, TaskDraft } from "@/types/task";

const hourLabels = Array.from(
  { length: 10 },
  (_, index) => `${String(index + 8).padStart(2, "0")}.00`,
);

type TimelineTask = {
  id: string;
  project: string;
  title: string;
  description: string;
  tone: ProjectColor;
  startSlot: number;
  durationSlots: number;
  column: "full" | "left" | "middle" | "right";
  badge?: string;
  sourceTask?: TaskDraft;
  persisted?: boolean;
};

type TimelinePreviewProps = {
  date: Date;
  onChangeDate: (date: Date) => void;
  onAddTask: (startTime?: string) => void;
  savedTasks: TaskDraft[];
  onEditTask: (task: TaskDraft) => void;
  onDeleteTask: (id: string) => void;
  loading: boolean;
  emptyMessage: string;
  status: string | null;
  submittedAt: string | null;
  readOnly: boolean;
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: () => void;
  withdrawing: boolean;
  onWithdraw: () => void;
};

export function TimelinePreview({
  date,
  onChangeDate,
  onAddTask,
  savedTasks,
  onEditTask,
  onDeleteTask,
  loading,
  emptyMessage,
  status,
  submittedAt,
  readOnly,
  canSubmit,
  submitting,
  onSubmit,
  withdrawing,
  onWithdraw,
}: TimelinePreviewProps) {
  const activeSavedTasks = savedTasks.filter((task) => !task.deletedAt);
  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
  const submittedLabel = submittedAt
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(submittedAt))
    : null;
  const moveDate = (days: number) => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    onChangeDate(nextDate);
  };
  const dayTasks: TimelineTask[] = activeSavedTasks.map((task, index) => ({
    id: task.id ?? `saved-${task.startTime}-${task.ticket}-${index}`,
    project: task.project,
    title: `${task.type}${task.ticket ? ` · ${task.ticket}` : ""} · ${formatDuration(task.durationMinutes)}`,
    description: task.summary,
    tone: task.projectColor,
    startSlot: timeToSlot(task.startTime),
    durationSlots: Math.max(1, Math.ceil(task.durationMinutes / 30)),
    column: "full",
    badge:
      task.workStatus === "BERJALAN"
        ? "Berjalan"
        : task.workStatus === "TERTAHAN"
          ? "Tertahan"
          : task.workStatus === "SELESAI"
            ? "Selesai"
            : undefined,
    sourceTask: task,
    persisted: true,
  }));

  const positionedTasks: TimelineTask[] = [];

  const sortedTasks = [...dayTasks].sort((a, b) => a.startSlot - b.startSlot);

  for (const task of sortedTasks) {
    const hasOverlap = dayTasks.some(
      (other) =>
        other.id !== task.id &&
        task.startSlot < other.startSlot + other.durationSlots &&
        other.startSlot < task.startSlot + task.durationSlots,
    );

    if (!hasOverlap) {
      positionedTasks.push({ ...task, column: "full" });
      continue;
    }

    const availableColumns = ["left", "middle", "right"] as const;

    const column =
      availableColumns.find(
        (candidate) =>
          !positionedTasks.some(
            (placed) =>
              placed.column === candidate &&
              task.startSlot < placed.startSlot + placed.durationSlots &&
              placed.startSlot < task.startSlot + task.durationSlots,
          ),
      ) ?? "right";

    positionedTasks.push({ ...task, column });
  }

  const projectSummaries = Object.values(
    positionedTasks.reduce<
      Record<
        string,
        {
          name: string;
          color: TimelineTask["tone"];
          minutes: number;
        }
      >
    >((summary, task) => {
      if (task.sourceTask?.type === "Istirahat") return summary;

      const projectName = task.project;

      if (!summary[projectName]) {
        summary[projectName] = {
          name: projectName,
          color: task.tone,
          minutes: 0,
        };
      }

      summary[projectName].minutes += task.sourceTask?.durationMinutes ?? 0;

      return summary;
    }, {}),
  );
  const totalWorkedMinutes = (() => {
    const intervals = dayTasks
      .filter((task) => task.sourceTask?.type !== "Istirahat")
      .map((task) => ({
        start: timeToMinutes(task.sourceTask!.startTime),
        end:
          timeToMinutes(task.sourceTask!.startTime) +
          task.sourceTask!.durationMinutes,
      }))
      .sort((a, b) => a.start - b.start);

    let total = 0;
    let currentEnd = -Infinity;

    for (const interval of intervals) {
      if (interval.end <= currentEnd) continue;

      const start = Math.max(interval.start, currentEnd);
      total += interval.end - start;
      currentEnd = interval.end;
    }

    return total;
  })();

  return (
    <section className="min-w-0 flex-1 p-4 sm:p-5 lg:p-7">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Home size={16} />
        <span aria-hidden="true">›</span>
        <span className="font-medium text-ink">Log Book</span>
        <span aria-hidden="true">›</span>
        <span className="font-semibold text-ink">{formattedDate}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => moveDate(-1)}
            className="rounded-xl border border-slate-200 bg-white p-2 text-ink shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Hari sebelumnya"
          >
            <ChevronLeft size={19} />
          </button>
          <h1 className="text-lg font-bold tracking-tight sm:text-2xl lg:text-3xl">
            {formattedDate}
          </h1>
          <button
            type="button"
            onClick={() => moveDate(1)}
            className="rounded-xl border border-slate-200 bg-white p-2 text-ink shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Hari berikutnya"
          >
            <ChevronRight size={19} />
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-slate-500 sm:text-sm">
          {status ? (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                readOnly
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {readOnly ? "Terkirim" : "Draf"}
            </span>
          ) : null}
          {status === "DRAF" ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit || submitting}
              title={canSubmit ? undefined : "Tambahkan minimal satu task sebelum mengirim."}
              className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              {submitting ? "Mengirim..." : "Kirim Daily Log"}
            </button>
          ) : null}
          <div className="flex items-center gap-1">
            <span>Total</span>
            <strong className="text-ink">
              {formatDuration(totalWorkedMinutes)}
            </strong>
            <span className="hidden sm:inline">(paralel dihitung sekali)</span>
            <details className="relative">
              <summary
                className="list-none cursor-pointer rounded p-1 hover:bg-blue-50"
                aria-label="Tentang perhitungan total jam"
              >
                <Info size={15} />
              </summary>
              <span className="absolute right-0 top-7 z-20 w-56 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600 shadow-lg">
                Rentang task yang waktunya bersamaan dihitung satu kali pada total
                harian.
              </span>
            </details>
          </div>
        </div>
      </div>

      {readOnly ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
          <span>
            Daily Log sudah dikirim{submittedLabel ? ` pada ${submittedLabel}` : ""}. Tarik kembali jika perlu diperbarui.
          </span>
          <button
            type="button"
            onClick={onWithdraw}
            disabled={withdrawing}
            className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            {withdrawing ? "Menarik..." : "Tarik Kembali"}
          </button>
        </div>
      ) : null}

      {emptyMessage ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" role="status">
          {emptyMessage}
        </p>
      ) : null}
      {loading ? <p className="mt-4 text-sm text-slate-500" role="status">Memuat task...</p> : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {projectSummaries.map((project) => (
          <ProjectChip
            key={project.name}
            name={project.name}
            color={project.color}
            hours={formatDuration(project.minutes)}
          />
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:p-3 lg:p-4">
        <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-2 sm:grid-cols-[3.75rem_minmax(0,1fr)] sm:gap-3">
          <div
            aria-hidden="true"
            className="grid grid-cols-1"
            style={{ gridTemplateRows: "repeat(18, minmax(0, 40px)) 24px" }}
          >
            {hourLabels.map((hour, index) => (
              <div
                key={hour}
                className="pt-1 text-xs font-medium text-slate-500 sm:text-sm"
                style={{ gridRow: index === 9 ? 19 : index * 2 + 1 }}
              >
                {hour}
              </div>
            ))}
          </div>
          <div
            className="relative grid min-w-0 grid-cols-3 gap-x-1.5 sm:gap-x-2"
            style={{ gridTemplateRows: "repeat(18, minmax(0, 40px)) 24px" }}
          >
            {Array.from({ length: 18 }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Tambah task pukul ${slotToInputTime(index + 1)}`}
                onClick={() => onAddTask(slotToInputTime(index + 1))}
                disabled={readOnly}
                className={`col-span-3 h-full border-t border-slate-100 bg-transparent text-left ${
                  readOnly ? "cursor-not-allowed" : "cursor-pointer hover:bg-blue-50/40"
                }`}
                style={{ gridRow: index + 1 }}
              />
            ))}
            {positionedTasks.map((task) => (
              <TimelineBlock
                key={task.id}
                task={task}
                onEdit={onEditTask}
                readOnly={readOnly}
              />
            ))}
            <div
              className="z-10 flex items-center rounded-xl border border-dashed border-slate-300 bg-white px-3 text-sm text-slate-500"
              style={{ gridRow: "9 / span 2", gridColumn: "1 / -1" }}
            >
              <Coffee size={18} className="mr-3 shrink-0" />
              Istirahat
            </div>
          </div>
        </div>
        {!readOnly ? (
          <button
            type="button"
            onClick={() => onAddTask()}
            className="ml-[3.75rem] mt-3 flex h-12 w-[calc(100%-3.75rem)] items-center justify-center rounded-xl border border-dashed border-brand bg-white text-sm font-semibold text-brand transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:ml-[4.5rem] sm:w-[calc(100%-4.5rem)]"
          >
            <Plus size={18} className="mr-2" />
            Tambah task mulai 16.00
          </button>
        ) : null}
      </div>
      <section
        className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        aria-live="polite"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">Task hari ini</h2>
            <p className="mt-1 text-xs text-slate-500">
              Daftar pekerjaan yang tercatat pada tanggal ini.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {dayTasks.length} task
          </span>
        </div>
        <ul className="mt-3 divide-y divide-slate-100">
          {dayTasks.length === 0 && !loading ? (
            <li className="py-3 text-sm text-slate-500">Belum ada task pada tanggal ini.</li>
          ) : null}
          {positionedTasks.map((task) => (
            <li
              key={`list-${task.id}`}
              className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{task.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {task.project} · {task.sourceTask?.startTime ?? slotToTime(task.startSlot)} ·{" "}
                  {formatDuration(task.sourceTask?.durationMinutes ?? task.durationSlots * 30)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {task.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {task.sourceTask ? (
                  readOnly ? null : (
                    <>
                      <button
                        type="button"
                        onClick={() => onEditTask(task.sourceTask!)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      {task.persisted ? (
                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.sourceTask!.id!)}
                          className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Hapus
                        </button>
                      ) : null}
                    </>
                  )
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Selesai
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

function timeToSlot(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 17;
  return Math.min(
    18,
    Math.max(1, (hours - 8) * 2 + Math.floor(minutes / 30) + 1),
  );
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes)
    ? hours * 60 + minutes
    : 0;
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} j ${remainder} m` : `${hours} j`;
}

function slotToTime(slot: number) {
  const totalMinutes = 8 * 60 + (slot - 1) * 30;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}.${String(totalMinutes % 60).padStart(2, "0")}`;
}

function slotToInputTime(slot: number) {
  const totalMinutes = 8 * 60 + (slot - 1) * 30;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

function TimelineBlock({
  task,
  onEdit,
  readOnly,
}: {
  task: TimelineTask;
  onEdit: (task: TaskDraft) => void;
  readOnly: boolean;
}) {
  const orange = task.tone === "orange";
  const interactive = Boolean(task.sourceTask) && !readOnly;
  const gridColumn =
    task.column === "full"
      ? "1 / -1"
      : task.column === "left"
        ? "1"
        : task.column === "middle"
          ? "2"
          : "3";
  return (
    <article
      onClick={() => {
        if (interactive && task.sourceTask) onEdit(task.sourceTask);
      }}
      onKeyDown={(event) => {
        if (interactive && task.sourceTask && (event.key === "Enter" || event.key === " ")) {
          onEdit(task.sourceTask);
        }
      }}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={`group z-10 min-w-0 overflow-hidden rounded-xl border p-2.5 sm:p-3 lg:p-4 ${orange ? "border-orange-200 bg-orange-50" : "border-blue-200 bg-blue-50"} ${interactive ? "cursor-pointer hover:brightness-95" : ""}`}
      style={{
        gridRow: `${task.startSlot} / span ${task.durationSlots}`,
        gridColumn,
        ...(task.tone.startsWith("#")
          ? { borderColor: task.tone, backgroundColor: `${task.tone}18` }
          : {}),
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex max-w-full items-center gap-2 truncate rounded-full px-2.5 py-1 text-[10px] font-bold sm:px-3 sm:text-xs ${
            orange
              ? "bg-orange-100 text-orange-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          <Folder size={13} className="shrink-0" />
          {task.project}
        </span>

        {task.badge ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold sm:text-xs ${
              task.badge === "Selesai"
                ? "bg-green-100 text-green-700"
                : task.badge === "Berjalan"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-orange-100 text-orange-700"
            }`}
          >
            {task.badge}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-xs font-bold text-ink sm:text-sm">{task.title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-700 sm:text-sm">
        {task.description}
      </p>
    </article>
  );
}
