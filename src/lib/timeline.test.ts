import { describe, expect, it } from "vitest";
import { buildDaySchedule } from "@/lib/timeline";
import { formatClock, nextStartMinute, resolveStartMinute } from "@/lib/taskTime";
import type { TaskDraft } from "@/types/task";

function task(overrides: Partial<TaskDraft> = {}): TaskDraft {
  return {
    project: "Alpha",
    projectColor: "blue",
    ticket: "",
    startTime: "08:00",
    durationMinutes: 60,
    type: "Development",
    summary: "Mengerjakan fitur",
    workStatus: "BERJALAN",
    ...overrides,
  };
}

describe("taskTime", () => {
  it("memakai startMinute absolut bila tersedia", () => {
    expect(resolveStartMinute(task({ startMinute: 1470, startTime: "00:30" }))).toBe(1470);
    expect(resolveStartMinute(task({ startTime: "23:15" }))).toBe(23 * 60 + 15);
  });

  it("membungkus jam 24+ menjadi jam 00-23 untuk input form", () => {
    expect(formatClock(1470)).toBe("00:30");
    expect(formatClock(1500)).toBe("01:00");
  });

  it("menyarankan jam selesai task terakhir, atau null bila lewat tengah malam", () => {
    expect(nextStartMinute([])).toBe(480);
    expect(nextStartMinute([task({ startMinute: 1080, durationMinutes: 90 })])).toBe(1170);
    expect(nextStartMinute([task({ startMinute: 23 * 60, durationMinutes: 120 })])).toBeNull();
  });
});

describe("buildDaySchedule", () => {
  it("memotong task yang melewati tengah malam di batas 24.00", () => {
    const schedule = buildDaySchedule([task({ startMinute: 23 * 60, durationMinutes: 120 })]);

    expect(schedule.early).toBeNull();
    expect(schedule.main.endMinute).toBe(24 * 60);
    expect(schedule.main.tasks).toHaveLength(1);
    expect(schedule.main.tasks[0]).toMatchObject({
      start: 23 * 60,
      end: 24 * 60,
      continuesNextDay: true,
      spill: false,
    });
  });

  it("menampilkan bagian dini hari dari task hari sebelumnya", () => {
    const schedule = buildDaySchedule(
      [],
      [task({ startMinute: 23 * 60, durationMinutes: 120 })],
    );

    expect(schedule.early).not.toBeNull();
    expect(schedule.early?.tasks).toHaveLength(1);
    expect(schedule.early?.tasks[0]).toMatchObject({
      start: 0,
      end: 60,
      spill: true,
    });
    // 00.00 - 01.00 ditambah satu jam berikutnya untuk menambah task.
    expect(schedule.early?.endMinute).toBe(120);
  });

  it("menampilkan tepat satu jam setelah task dini hari berakhir", () => {
    const schedule = buildDaySchedule(
      [],
      [task({ startMinute: 23 * 60, durationMinutes: 320 })],
    );

    // Task selesai 04.20, jadi area tambahan berhenti tepat satu jam kemudian
    // dan dibulatkan ke slot 30 menit: 05.30.
    expect(schedule.early?.endMinute).toBe(5 * 60 + 30);
  });

  it("menampilkan task dini hari milik tanggal itu sendiri sebagai task yang bisa diubah", () => {
    const schedule = buildDaySchedule([task({ startMinute: 90, durationMinutes: 30 })]);

    expect(schedule.early?.tasks).toHaveLength(1);
    expect(schedule.early?.tasks[0]).toMatchObject({ start: 90, end: 120, spill: false });
    expect(schedule.main.tasks).toHaveLength(0);
  });

  it("membatasi segmen dini hari maksimal 08.00", () => {
    const schedule = buildDaySchedule(
      [task({ startMinute: 7 * 60 + 30, durationMinutes: 120 })],
    );

    expect(schedule.early?.endMinute).toBe(480);
  });

  it("tidak menampilkan segmen dini hari bila tidak ada task lewat tengah malam", () => {
    const schedule = buildDaySchedule([task({ startMinute: 9 * 60, durationMinutes: 60 })]);

    expect(schedule.early).toBeNull();
    expect(schedule.main.endMinute).toBe(17 * 60);
  });
});
