import {
  EARLY_MORNING_END_MINUTE,
  MINUTES_PER_DAY,
  WORKDAY_END_MINUTE,
  WORKDAY_START_MINUTE,
  resolveStartMinute,
} from "@/lib/taskTime";
import type { TaskDraft } from "@/types/task";

export const SLOT_MINUTES = 30;

export type ScheduledTask = {
  task: TaskDraft;
  /** Menit mulai di dalam tanggal halaman (0 - 1440). */
  start: number;
  /** Menit selesai di dalam tanggal halaman, sudah dipotong di batas segmen. */
  end: number;
  /** Bagian task milik hari sebelumnya yang berlanjut setelah tengah malam. */
  spill: boolean;
  /** Task berlanjut melewati tengah malam sehingga sisanya tampil di tanggal berikutnya. */
  continuesNextDay: boolean;
};

export type TimelineSegment = {
  startMinute: number;
  endMinute: number;
  tasks: ScheduledTask[];
};

export type DaySchedule = {
  early: TimelineSegment | null;
  main: TimelineSegment;
};

function ceilToHour(minutes: number) {
  return Math.ceil(minutes / 60) * 60;
}

function ceilToSlot(minutes: number) {
  return Math.ceil(minutes / SLOT_MINUTES) * SLOT_MINUTES;
}

/**
 * Memisahkan task menjadi segmen jam kerja (08.00 ke atas) dan segmen dini hari
 * (00.00 - 08.00). Bagian task tanggal sebelumnya yang melewati tengah malam
 * ikut ditampilkan di segmen dini hari sebagai `spill` dan tidak dapat diubah.
 */
export function buildDaySchedule(
  tasks: TaskDraft[] = [],
  previousDayTasks: TaskDraft[] = [],
): DaySchedule {
  const ownTasks = tasks.filter((task) => !task.deletedAt);
  const scheduled: ScheduledTask[] = [];

  for (const task of ownTasks) {
    const start = resolveStartMinute(task);
    const duration = task.durationMinutes;
    if (!Number.isFinite(start) || !Number.isFinite(duration) || duration <= 0) continue;
    // Task yang mulai setelah tengah malam milik tanggal berikutnya; tampil di sana.
    if (start >= MINUTES_PER_DAY) continue;

    const end = start + duration;
    if (start < WORKDAY_START_MINUTE) {
      scheduled.push({
        task,
        start,
        end: Math.min(end, EARLY_MORNING_END_MINUTE),
        spill: false,
        continuesNextDay: end > EARLY_MORNING_END_MINUTE,
      });
    } else {
      scheduled.push({
        task,
        start,
        end: Math.min(end, MINUTES_PER_DAY),
        spill: false,
        continuesNextDay: end > MINUTES_PER_DAY,
      });
    }
  }

  const spillTasks: ScheduledTask[] = [];
  for (const task of previousDayTasks) {
    if (task.deletedAt) continue;
    const start = resolveStartMinute(task);
    const duration = task.durationMinutes;
    if (!Number.isFinite(start) || !Number.isFinite(duration) || duration <= 0) continue;

    // Hanya bagian setelah 00.00 yang ditampilkan pada tanggal ini.
    const portionStart = Math.max(0, start - MINUTES_PER_DAY);
    const portionEnd = start + duration - MINUTES_PER_DAY;
    if (portionEnd <= 0 || portionStart >= EARLY_MORNING_END_MINUTE) continue;

    spillTasks.push({
      task,
      start: portionStart,
      end: Math.min(portionEnd, EARLY_MORNING_END_MINUTE),
      spill: true,
      continuesNextDay: portionEnd > EARLY_MORNING_END_MINUTE,
    });
  }

  const earlyTaskList = [...spillTasks, ...scheduled.filter((entry) => entry.start < WORKDAY_START_MINUTE)]
    .sort((a, b) => a.start - b.start);

  const early = earlyTaskList.length
    ? {
        startMinute: 0,
        // Tampilkan tepat satu jam setelah task terakhir, dibulatkan ke slot
        // 30 menit terdekat supaya barisnya tetap rapi.
        endMinute: Math.min(
          EARLY_MORNING_END_MINUTE,
          ceilToSlot(Math.max(...earlyTaskList.map((entry) => entry.end))) + 60,
        ),
        tasks: earlyTaskList,
      }
    : null;

  const mainTasks = scheduled
    .filter((entry) => entry.start >= WORKDAY_START_MINUTE)
    .sort((a, b) => a.start - b.start);
  const latestMainEnd = mainTasks.reduce((latest, entry) => Math.max(latest, entry.end), 0);

  return {
    early,
    main: {
      startMinute: WORKDAY_START_MINUTE,
      endMinute: Math.min(
        MINUTES_PER_DAY,
        Math.max(WORKDAY_END_MINUTE, latestMainEnd ? ceilToHour(latestMainEnd) : 0),
      ),
      tasks: mainTasks,
    },
  };
}
