import { describe, expect, it } from "vitest";
import { buildDaySchedule } from "@/lib/timeline";
import { statusFromCode, taskFromDto, tasksFromDay, workStatusFromLabel } from "@/lib/reviewMapper";
import type { DayTaskDto } from "@/types/reviewApi";

describe("statusFromCode", () => {
  it.each([
    ["DRAF", "Draf"],
    ["MENUNGGU", "Menunggu"],
    ["DISETUJUI", "Disetujui"],
    ["DITOLAK", "Ditolak"],
    ["TERLEWAT", "Terlewat"],
    ["PERBAIKAN_DIAJUKAN", "Perbaikan diajukan"],
    ["DRAF_DIBUKA_KEMBALI", "Draf dibuka kembali"],
  ])("memetakan %s", (code, expected) => {
    expect(statusFromCode(code)).toBe(expected);
  });

  it("mengabaikan kapitalisasi dan spasi serta menolak kode tak dikenal", () => {
    expect(statusFromCode("  dRaF  ")).toBe("Draf");
    expect(statusFromCode("BELUM_MULAI")).toBeNull();
    expect(statusFromCode("KODE_NGAWUR")).toBeNull();
    expect(statusFromCode(null)).toBeNull();
    expect(statusFromCode(undefined)).toBeNull();
  });
});

describe("workStatusFromLabel", () => {
  it.each([
    ["Selesai", "SELESAI"],
    [" berjalan ", "BERJALAN"],
    ["TERTAHAN", "TERTAHAN"],
    ["label lain", "BERJALAN"],
    [null, "BERJALAN"],
    [undefined, "BERJALAN"],
  ])("memetakan %s", (label, expected) => {
    expect(workStatusFromLabel(label)).toBe(expected);
  });
});

describe("taskFromDto", () => {
  it("memetakan data hari, termasuk nilai opsional null", () => {
    expect(taskFromDto({
      id: 12,
      project: "Alpha",
      color: "#123456",
      ticket: null,
      startMinute: 600,
      durationMinutes: 45,
      type: "Development",
      summary: "Mengerjakan fitur",
      workStatus: "Selesai",
      obstacle: null,
    })).toEqual({
      id: "12",
      project: "Alpha",
      projectColor: "#123456",
      ticket: "",
      startTime: "10:00",
      startMinute: 600,
      durationMinutes: 45,
      type: "Development",
      summary: "Mengerjakan fitur",
      obstacle: undefined,
      workStatus: "SELESAI",
    });
  });

  it("membungkus jam tampilan lewat tengah malam dan mempertahankan menit absolut untuk spill", () => {
    const task = taskFromDto({
      project: "Alpha",
      color: "#123456",
      startMinute: 1470,
      durationMinutes: 60,
      type: "Development",
      summary: "Pekerjaan malam",
      workStatus: "Berjalan",
    });

    expect(task.startTime).toBe("00:30");
    expect(task.startMinute).toBe(1470);
    expect(buildDaySchedule([], [task]).early?.tasks[0]).toMatchObject({
      start: 30,
      end: 90,
      spill: true,
    });
  });

  it("tidak melempar untuk task null, undefined, atau kosong", () => {
    expect(() => taskFromDto(null)).not.toThrow();
    expect(() => taskFromDto(undefined)).not.toThrow();
    expect(() => taskFromDto({})).not.toThrow();
  });
});

describe("tasksFromDay", () => {
  it("mengurutkan menurut startMinute dan aman untuk daftar kosong atau hari nullish", () => {
    const tasks: DayTaskDto[] = [
      { startMinute: 900, durationMinutes: 30 },
      { startMinute: 600, durationMinutes: 30 },
      { startMinute: 1470, durationMinutes: 30 },
    ];

    expect(tasksFromDay({ tasks }).map((task) => task.startMinute)).toEqual([600, 900, 1470]);
    expect(tasksFromDay({ tasks: [] })).toEqual([]);
    expect(tasksFromDay({ tasks: null })).toEqual([]);
    expect(tasksFromDay(null)).toEqual([]);
    expect(tasksFromDay(undefined)).toEqual([]);
  });
});