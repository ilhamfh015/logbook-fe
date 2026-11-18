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
import { buildDaySchedule, SLOT_MINUTES, type ScheduledTask, type TimelineSegment } from "@/lib/timeline";
import {
  formatClock,
  formatHourLabel,
  nextStartMinute,
  resolveStartMinute,
  WORKDAY_START_MINUTE,
} from "@/lib/taskTime";
import type { DayInfo } from "@/services/taskService";
import type { ProjectColor, TaskDraft } from "@/types/task";

type TimelineTask = {
  id: string;
  project: string;
  title: string;
  description: string;
  tone: ProjectColor;
  startSlot: number;
  durationSlots: number;
  column: number;
  badge?: string;
  sourceTask?: TaskDraft;
  persisted?: boolean;
  spill?: boolean;
  continuesNextDay?: boolean;
};

type TimelinePreviewProps = {
  date: Date;
  onChangeDate: (date: Date) => void;
  onAddTask: (startMinute?: number) => void;
  savedTasks: TaskDraft[];
  /** Task tanggal sebelumnya yang berlanjut melewati tengah malam (hanya untuk ditampilkan). */
  previousDayTasks?: TaskDraft[];
  onEditTask: (task: TaskDraft) => void;
  onDeleteTask: (id: string) => void;
  loading: boolean;
  emptyMessage: string;
  status: string | null;
  day: DayInfo | null;
  submittedAt: string | null;
  readOnly: boolean;
  lockMessage: string | null;
  deadlineLabel: string | null;
  rejectionReason: string | null;
  canWithdraw: boolean;
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: () => void;
  withdrawing: boolean;
  onWithdraw: () => void;
  variant?: "talent" | "review";
};

export function TimelinePreview({
  date,
  onChangeDate,
  onAddTask,
  savedTasks,
  previousDayTasks = [],
  onEditTask,
  onDeleteTask,
  loading,
  emptyMessage,
  status,
  day,
  submittedAt,
  readOnly,
  lockMessage,
  deadlineLabel,
  rejectionReason,
  canWithdraw,
  canSubmit,
  submitting,
  onSubmit,
  withdrawing,
  onWithdraw,
  variant = "talent",
}: TimelinePreviewProps) {
  const activeSavedTasks = savedTasks.filter((task) => !task.deletedAt);
  const schedule = buildDaySchedule(activeSavedTasks, previousDayTasks);
  const nextStart = nextStartMinute(activeSavedTasks);
  const previousDayLabel = formatShortDate(addDays(date, -1));
  const nextDayLabel = formatShortDate(addDays(date, 1));
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
  const dayLabel = day
    ? day.holidayName
      ? `Libur: ${day.holidayName}`
      : day.onLeave
        ? "Cuti"
        : day.weekend
          ? "Akhir pekan"
          : null
    : null;
  const dayNote =
    day && !day.workingDay
      ? `${
          day.holidayName
            ? `Libur nasional: ${day.holidayName}. `
            : day.onLeave
              ? "Kamu sedang cuti. "
              : "Akhir pekan. "
        }Hari ini tidak akan ditandai Terlewat, tetapi tetap boleh diisi bila kamu bekerja.`
      : null;
  const moveDate = (days: number) => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    onChangeDate(nextDate);
  };
  const earlyTasks = schedule.early?.tasks ?? [];
  const ownTasks = [
    ...earlyTasks.filter((entry) => !entry.spill),
    ...schedule.main.tasks,
  ].sort((a, b) => a.start - b.start);

  const projectSummaries = Object.values(
    ownTasks.reduce<
      Record<string, { name: string; color: TimelineTask["tone"]; minutes: number }>
    >((summary, entry) => {
      if (entry.task.type === "Istirahat") return summary;
      const projectName = entry.task.project;
      if (!summary[projectName]) {
        summary[projectName] = {
          name: projectName,
          color: entry.task.projectColor,
          minutes: 0,
        };
      }
      summary[projectName].minutes += entry.task.durationMinutes;
      return summary;
    }, {}),
  );

  const totalWorkedMinutes = (() => {
    const intervals = ownTasks
      .filter((entry) => entry.task.type !== "Istirahat")
      .map((entry) => ({
        start: entry.start,
        end: resolveStartMinute(entry.task) + entry.task.durationMinutes,
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
      {variant === "talent" ? (
        <>
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
                    status === "MENUNGGU"
                      ? "bg-emerald-50 text-emerald-700"
                      : status === "DITOLAK"
                        ? "bg-red-50 text-red-700"
                        : readOnly
                          ? "bg-slate-100 text-slate-600"
                          : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {dailyLogStatusLabel(status)}
                </span>
              ) : null}
              {dayLabel ? (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    day?.holidayName
                      ? "bg-sky-50 text-sky-700"
                      : day?.onLeave
                        ? "bg-violet-50 text-violet-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {dayLabel}
                </span>
              ) : null}
              {(status === "DRAF" || status === "DITOLAK") && !readOnly ? (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={!canSubmit || submitting}
                  title={
                    canSubmit
                      ? undefined
                      : "Tambahkan minimal satu task sebelum mengirim."
                  }
                  className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  {submitting
                    ? "Mengirim..."
                    : status === "DITOLAK"
                      ? "Kirim Ulang"
                      : "Kirim Daily Log"}
                </button>
              ) : null}
              <div className="flex items-center gap-1">
                <span>Total</span>
                <strong className="text-ink">
                  {formatDuration(totalWorkedMinutes)}
                </strong>
                <span className="hidden sm:inline">
                  (paralel dihitung sekali)
                </span>
                <details className="relative">
                  <summary
                    className="list-none cursor-pointer rounded p-1 hover:bg-blue-50"
                    aria-label="Tentang perhitungan total jam"
                  >
                    <Info size={15} />
                  </summary>
                  <span className="absolute right-0 top-7 z-20 w-56 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600 shadow-lg">
                    Rentang task yang waktunya bersamaan dihitung satu kali pada
                    total harian.
                  </span>
                </details>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {variant === "talent" && dayNote ? (
        <p
          className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800"
          role="status"
        >
          {dayNote}
        </p>
      ) : null}

      {variant === "talent" && status === "DITOLAK" ? (
        <div
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          role="status"
        >
          <p className="font-semibold">Daily Log ditolak atasan.</p>
          {rejectionReason ? (
            <p className="mt-1">Catatan atasan: {rejectionReason}</p>
          ) : null}
          <p className="mt-1 text-red-700">
            {readOnly
              ? "Perbaikan hanya dapat dilakukan pada tanggal hari ini."
              : "Perbaiki task bila perlu, lalu kirim ulang pada hari ini."}
          </p>
        </div>
      ) : null}

      {variant === "talent" && lockMessage ? (
        <div
          className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm ${
            canWithdraw
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
          role="status"
        >
          <span>
            {lockMessage}
            {status === "MENUNGGU" && submittedLabel
              ? ` Dikirim pada ${submittedLabel}.`
              : null}
            {status !== "MENUNGGU" && deadlineLabel
              ? ` Batas pengisian ${deadlineLabel}.`
              : null}
          </span>
          {canWithdraw ? (
            <button
              type="button"
              onClick={onWithdraw}
              disabled={withdrawing}
              className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {withdrawing ? "Menarik..." : "Tarik Kembali"}
            </button>
          ) : null}
        </div>
      ) : null}

      {variant === "talent" && emptyMessage ? (
        <p
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
          role="status"
        >
          {emptyMessage}
        </p>
      ) : null}
      {variant === "talent" && loading ? (
        <p className="mt-4 text-sm text-slate-500" role="status">
          Memuat task...
        </p>
      ) : null}

      {variant === "review" ? (
        <div className="mt-4 flex justify-end text-sm text-slate-500">
          Total {formatDuration(totalWorkedMinutes)} (paralel dihitung sekali)
        </div>
      ) : null}

      <div
        className={`${variant === "review" ? "" : "mt-5"} flex flex-wrap gap-2`}
      >
        {projectSummaries.map((project) => (
          <ProjectChip
            key={project.name}
            name={project.name}
            color={project.color}
            hours={formatDuration(project.minutes)}
          />
        ))}
      </div>

      <div
        aria-label={
          variant === "review" ? "Linimasa Daily Log, hanya baca" : undefined
        }
        role={variant === "review" ? "group" : undefined}
        className="mt-5 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:p-3 lg:p-4"
      >
        {schedule.early ? (
          <div className="mb-4">
            <p className="mb-2 flex flex-wrap items-center gap-2 px-1 text-xs font-semibold text-slate-600">
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700">
                Dini hari
              </span>
              <span className="font-normal text-slate-500">
                00.00–08.00. Jam setelah tengah malam ditampilkan di tanggal ini.
              </span>
            </p>
            <SegmentGrid
              segment={schedule.early}
              variant={variant}
              readOnly={readOnly}
              onAddTask={onAddTask}
              onEditTask={onEditTask}
              spillLabel={previousDayLabel}
              hideLastLabel={schedule.early.endMinute >= WORKDAY_START_MINUTE}
            />
            {schedule.early.endMinute < WORKDAY_START_MINUTE ? (
              // Jam 08.00 tetap jadi awal segmen jam kerja, jadi selang di
              // antaranya dipisahkan dengan pembatas agar linimasa tidak
              // terlihat menyatu.
              <div
                aria-hidden="true"
                className="mt-3 grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[3.75rem_minmax(0,1fr)] sm:gap-3"
              >
                <span />
                <span className="flex items-center gap-2 sm:gap-3">
                  <span className="h-px flex-1 border-t border-dashed border-slate-300" />
                  <span className="shrink-0 rounded-full border border-dashed border-slate-300 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-500">
                    {formatBoundary(schedule.early.endMinute)} →{" "}
                    {formatHourLabel(WORKDAY_START_MINUTE)}
                  </span>
                  <span className="h-px flex-1 border-t border-dashed border-slate-300" />
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        <SegmentGrid
          segment={schedule.main}
          variant={variant}
          readOnly={readOnly}
          onAddTask={onAddTask}
          onEditTask={onEditTask}
          spillLabel={previousDayLabel}
          showBreak
        />

        {variant === "talent" && !readOnly ? (
          nextStart === null ? (
            <p
              className="ml-[3.75rem] mt-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:ml-[4.5rem]"
              role="status"
            >
              Task terakhir berlanjut melewati tengah malam. Lanjutannya (00.00–08.00)
              diisi pada tanggal {nextDayLabel}.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => onAddTask(nextStart)}
              className="ml-[3.75rem] mt-3 flex h-12 w-[calc(100%-3.75rem)] items-center justify-center rounded-xl border border-dashed border-brand bg-white text-sm font-semibold text-brand transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:ml-[4.5rem] sm:w-[calc(100%-4.5rem)]"
            >
              <Plus size={18} className="mr-2" />
              Tambah task mulai {formatClock(nextStart, ".")}
            </button>
          )
        ) : null}
      </div>

      {variant === "talent" ? (
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
              {ownTasks.length} task
            </span>
          </div>
          <ul className="mt-3 divide-y divide-slate-100">
            {ownTasks.length === 0 && !loading ? (
              <li className="py-3 text-sm text-slate-500">
                Belum ada task pada tanggal ini.
              </li>
            ) : null}
            {ownTasks.map((entry) => {
              const segment =
                entry.start < schedule.main.startMinute && schedule.early
                  ? schedule.early
                  : schedule.main;
              const task = toTimelineTask(entry, segment, previousDayLabel);
              const continuesNextDay =
                entry.continuesNextDay && entry.start >= schedule.main.startMinute;
              return (
                <li
                  key={`list-${task.id}`}
                  className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{task.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {task.project} · {formatClock(entry.start)} ·{" "}
                      {formatDuration(entry.task.durationMinutes)}
                      {continuesNextDay ? ` · berlanjut ke ${nextDayLabel}` : null}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {entry.task.summary}
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
              );
            })}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

function SegmentGrid({
  segment,
  variant,
  readOnly,
  onAddTask,
  onEditTask,
  spillLabel,
  showBreak = false,
  hideLastLabel = false,
}: {
  segment: TimelineSegment;
  variant: "talent" | "review";
  readOnly: boolean;
  onAddTask: (startMinute?: number) => void;
  onEditTask: (task: TaskDraft) => void;
  spillLabel: string;
  showBreak?: boolean;
  hideLastLabel?: boolean;
}) {
  const slots = Math.max(1, Math.round((segment.endMinute - segment.startMinute) / SLOT_MINUTES));
  const hourMarks = (() => {
    const marks: Array<{ minute: number; label: string }> = [];
    for (let minute = segment.startMinute; minute < segment.endMinute; minute += 60) {
      marks.push({ minute, label: formatHourLabel(minute) });
    }
    // Jam penutup memakai waktu sebenarnya, mis. 05.30 ketika area tambahan
    // berakhir di tengah jam. Jam bulat tetap ditulis sebagai 24.00.
    marks.push({ minute: segment.endMinute, label: formatBoundary(segment.endMinute) });
    return marks;
  })();
  const { positioned, columns } = positionTasks(segment, spillLabel);
  const breakRow = showBreak ? (12 * 60 - segment.startMinute) / SLOT_MINUTES + 1 : null;

  return (
    <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-2 sm:grid-cols-[3.75rem_minmax(0,1fr)] sm:gap-3">
      <div
        aria-hidden="true"
        className="grid grid-cols-1"
        style={{
          gridTemplateRows: `repeat(${slots}, minmax(0, 40px)) 24px`,
        }}
      >
        {hourMarks.map((mark, index) => {
          // Jam penutup segmen dini hari (08.00) juga menjadi jam pembuka
          // segmen jam kerja, jadi cukup ditampilkan sekali.
          if (hideLastLabel && index === hourMarks.length - 1) return null;
          return (
            <div
              key={mark.minute}
              className="pt-1 text-xs font-medium text-slate-500 sm:text-sm"
              style={{
                gridRow: (mark.minute - segment.startMinute) / SLOT_MINUTES + 1,
              }}
            >
              {mark.label}
            </div>
          );
        })}
      </div>
      <div
        className="relative grid min-w-0 gap-x-1.5 sm:gap-x-2"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${slots}, minmax(0, 40px)) 24px`,
        }}
      >
        {variant === "talent"
          ? Array.from({ length: slots }, (_, index) => {
              const slotStart = segment.startMinute + index * SLOT_MINUTES;
              return (
                <button
                  key={index}
                  type="button"
                  aria-label={`Tambah task pukul ${formatClock(slotStart)}`}
                  onClick={() => onAddTask(slotStart)}
                  disabled={readOnly}
                  className={`col-span-full h-full border-t border-slate-100 bg-transparent text-left ${
                    readOnly
                      ? "cursor-not-allowed"
                      : "cursor-pointer hover:bg-blue-50/40"
                  }`}
                  style={{ gridRow: index + 1 }}
                />
              );
            })
          : null}
        {positioned.map((task) => (
          <TimelineBlock
            key={task.id}
            task={task}
            onEdit={onEditTask}
            readOnly={readOnly}
            variant={variant}
          />
        ))}
        {breakRow !== null ? (
          <div
            className="z-10 flex items-center rounded-xl border border-dashed border-slate-300 bg-white px-3 text-sm text-slate-500"
            style={{ gridRow: `${breakRow} / span 2`, gridColumn: "1 / -1" }}
          >
            <Coffee size={18} className="mr-3 shrink-0" />
            Istirahat
          </div>
        ) : null}
      </div>
    </div>
  );
}

function toTimelineTask(
  entry: ScheduledTask,
  segment: TimelineSegment,
  spillLabel: string,
): TimelineTask {
  const startSlot = Math.round((entry.start - segment.startMinute) / SLOT_MINUTES) + 1;
  const durationSlots = Math.max(
    1,
    Math.ceil((entry.end - entry.start) / SLOT_MINUTES),
  );
  const workStatusBadge =
    entry.task.workStatus === "BERJALAN"
      ? "Berjalan"
      : entry.task.workStatus === "TERTAHAN"
        ? "Tertahan"
        : entry.task.workStatus === "SELESAI"
          ? "Selesai"
          : undefined;

  return {
    id: entry.task.id ?? `saved-${entry.task.startTime}-${entry.task.ticket}-${entry.start}`,
    project: entry.task.project,
    title: `${entry.task.type}${entry.task.ticket ? ` · ${entry.task.ticket}` : ""} · ${formatDuration(entry.task.durationMinutes)}`,
    description: entry.task.summary,
    tone: entry.task.projectColor,
    startSlot,
    durationSlots,
    column: 0,
    badge: entry.spill ? `Lanjutan ${spillLabel}` : workStatusBadge,
    sourceTask: entry.task,
    persisted: Boolean(entry.task.id),
    spill: entry.spill,
    continuesNextDay: entry.continuesNextDay,
  };
}

function positionTasks(segment: TimelineSegment, spillLabel: string) {
  const positioned: TimelineTask[] = [];
  let maxColumn = 0;

  for (const entry of segment.tasks) {
    const task = toTimelineTask(entry, segment, spillLabel);
    const hasOverlap = segment.tasks.some((other) => {
      if (other === entry) return false;
      const otherTask = toTimelineTask(other, segment, spillLabel);
      return (
        task.startSlot < otherTask.startSlot + otherTask.durationSlots &&
        otherTask.startSlot < task.startSlot + task.durationSlots
      );
    });

    if (!hasOverlap) {
      positioned.push({ ...task, column: 0 });
      continue;
    }

    let column = 1;
    while (
      positioned.some(
        (placed) =>
          placed.column === column &&
          task.startSlot < placed.startSlot + placed.durationSlots &&
          placed.startSlot < task.startSlot + task.durationSlots,
      )
    ) {
      column += 1;
    }

    if (column > maxColumn) maxColumn = column;
    positioned.push({ ...task, column });
  }

  return { positioned, columns: Math.max(1, maxColumn) };
}

export function dailyLogStatusLabel(status: string | null) {
  const labels: Record<string, string> = {
    DRAF: "Draf",
    MENUNGGU: "Menunggu",
    DISETUJUI: "Disetujui",
    DITOLAK: "Ditolak",
    TERLEWAT: "Terlewat",
    PERBAIKAN_DIAJUKAN: "Perbaikan diajukan",
    DRAF_DIBUKA_KEMBALI: "Draf dibuka kembali",
  };

  return status ? (labels[status] ?? status) : "Draf";
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} j ${remainder} m` : `${hours} j`;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(date);
}

/** Label batas jam: jam bulat ditulis 08.00, selain itu 05.30. */
function formatBoundary(totalMinutes: number) {
  return totalMinutes % 60 === 0
    ? formatHourLabel(totalMinutes)
    : formatClock(totalMinutes, ".");
}

function TimelineBlock({
  task,
  onEdit,
  readOnly,
  variant,
}: {
  task: TimelineTask;
  onEdit: (task: TaskDraft) => void;
  readOnly: boolean;
  variant: "talent" | "review";
}) {
  const orange = task.tone === "orange";
  const interactive =
    variant === "talent" &&
    Boolean(task.sourceTask) &&
    !task.spill &&
    !readOnly;
  const reviewTitle = [
    task.project,
    task.title,
    task.badge,
    task.description,
    task.sourceTask?.obstacle ? `Kendala: ${task.sourceTask.obstacle}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const gridColumn = task.column === 0 ? "1 / -1" : String(task.column);
  return (
    <article
      onClick={
        variant === "talent"
          ? () => {
              if (interactive && task.sourceTask) onEdit(task.sourceTask);
            }
          : undefined
      }
      onKeyDown={
        variant === "talent"
          ? (event) => {
              if (
                interactive &&
                task.sourceTask &&
                (event.key === "Enter" || event.key === " ")
              ) {
                onEdit(task.sourceTask);
              }
            }
          : undefined
      }
      title={variant === "review" ? reviewTitle : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={`group z-10 min-w-0 overflow-hidden ${
        variant === "review"
          ? "rounded-lg border p-1 sm:p-1.5"
          : "rounded-xl border p-2.5 sm:p-3 lg:p-4"
      } ${
        task.spill
          ? "border-dashed border-slate-300 bg-slate-50"
          : orange
            ? "border-orange-200 bg-orange-50"
            : "border-blue-200 bg-blue-50"
      } ${interactive ? "cursor-pointer hover:brightness-95" : ""}`}
      style={{
        gridRow: `${task.startSlot} / span ${task.durationSlots}`,
        gridColumn,
        ...(task.tone.startsWith("#") && !task.spill
          ? { borderColor: task.tone, backgroundColor: `${task.tone}18` }
          : {}),
      }}
    >
      {variant === "review" ? (
        <div className="min-h-0 overflow-hidden">
          {task.durationSlots === 1 ? (
            <p className="truncate whitespace-nowrap text-[9px] font-semibold leading-3 text-slate-800">
              {task.project} · {task.title} · {task.badge}
            </p>
          ) : task.durationSlots === 2 ? (
            <>
              <p
                className={`truncate text-[9px] font-bold leading-3 ${orange ? "text-orange-700" : "text-blue-700"}`}
              >
                {task.project}
              </p>
              <p className="mt-0.5 truncate text-[9px] font-bold leading-3 text-ink">
                {task.title}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[9px] leading-3 text-slate-700">
                {task.description}
              </p>
              <p className="mt-0.5 truncate text-[9px] font-semibold leading-3 text-slate-700">
                {task.badge}
              </p>
            </>
          ) : (
            <>
              <div className="flex min-w-0 items-center justify-between gap-1 leading-none">
                <span
                  className={`truncate text-[9px] font-bold ${orange ? "text-orange-700" : "text-blue-700"}`}
                >
                  {task.project}
                </span>
                {task.badge ? (
                  <span className="shrink-0 text-[9px] font-semibold text-slate-700">
                    {task.badge}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-[10px] font-bold leading-3 text-ink">
                {task.title}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[9px] leading-3 text-slate-700">
                {task.description}
              </p>
              {task.sourceTask?.obstacle ? (
                <p className="line-clamp-1 text-[9px] leading-3 text-slate-600">
                  Kendala: {task.sourceTask.obstacle}
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex max-w-full items-center gap-2 truncate rounded-full px-2.5 py-1 text-[10px] font-bold sm:px-3 sm:text-xs ${
                task.spill
                  ? "bg-slate-200 text-slate-700"
                  : orange
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
                  task.spill
                    ? "bg-slate-200 text-slate-700"
                    : task.badge === "Selesai"
                      ? "bg-green-100 text-green-700"
                      : task.badge === "Berjalan"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-orange-100 text-orange-700"
                }`}
              >
                {task.badge}
              </span>
            ) : null}
            {task.continuesNextDay && !task.spill ? (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                Lanjut setelah 24.00
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-xs font-bold text-ink sm:text-sm">
            {task.title}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-700 sm:text-sm">
            {task.description}
          </p>
        </>
      )}
    </article>
  );
}
