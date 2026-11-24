import { describe, expect, it } from "vitest";
import { mapTeamMember } from "@/lib/teamMapper";
import type { TeamMemberDto } from "@/types/reviewApi";

function member(overrides: Partial<TeamMemberDto> = {}): TeamMemberDto {
  return {
    userId: 17,
    fullName: "Sari Wulandari",
    email: "sari@example.test",
    jenis: "KARYAWAN",
    date: "2026-11-17",
    dailyLogId: null,
    status: "DRAF",
    totalDurationMinutes: 0,
    pendingDays: 0,
    ...overrides,
  };
}

describe("mapTeamMember", () => {
  it.each([
    ["DRAF", "Draf"],
    ["MENUNGGU", "Menunggu"],
    ["DISETUJUI", "Disetujui"],
    ["DITOLAK", "Ditolak"],
    ["TERLEWAT", "Terlewat"],
    ["PERBAIKAN_DIAJUKAN", "Perbaikan diajukan"],
    ["DRAF_DIBUKA_KEMBALI", "Draf dibuka kembali"],
    ["BELUM_MULAI", "Belum mulai"],
    ["KODE_ASING", "Status tidak diketahui"],
  ])("maps status %s to %s", (code, label) => {
    expect(mapTeamMember(member({ status: code })).status).toBe(label);
  });

  it.each([
    [0, "0 j"],
    [90, "1 j 30 m"],
    [210, "3 j 30 m"],
  ])("formats %i minutes as %s", (minutes, label) => {
    expect(mapTeamMember(member({ totalDurationMinutes: minutes })).hours).toBe(label);
  });

  it("maps the initial and supported member types", () => {
    expect(mapTeamMember(member({ fullName: "rina aulia", jenis: "PKL" }))).toMatchObject({
      initial: "R",
      jenis: "PKL",
    });
    expect(mapTeamMember(member({ jenis: "MAGANG" })).jenis).toBe("Magang");
    expect(mapTeamMember(member({ jenis: "KARYAWAN" })).jenis).toBe("Karyawan");
    expect(mapTeamMember(member({ jenis: "LAIN" })).jenis).toBe("Lainnya");
  });

  it("links today's waiting log and summarizes remaining pending days", () => {
    const row = mapTeamMember(member({
      status: "MENUNGGU",
      dailyLogId: 91,
      totalDurationMinutes: 420,
      pendingDays: 3,
    }));

    expect(row.pending).toEqual([
      { text: "Sel, 17 Nov · 7 j", date: "2026-11-17" },
      { text: "2 hari menunggu", date: null },
    ]);
  });

  it("omits summaries for zero pending days and keeps one today's item", () => {
    expect(mapTeamMember(member({
      status: "MENUNGGU",
      dailyLogId: 91,
      pendingDays: 0,
    })).pending).toHaveLength(1);
    expect(mapTeamMember(member({ pendingDays: 0 })).pending).toEqual([]);
  });

  it("shows all pending days as a non-clickable summary without a current log id", () => {
    expect(mapTeamMember(member({
      status: "MENUNGGU",
      dailyLogId: null,
      pendingDays: 1,
    })).pending).toEqual([{ text: "1 hari menunggu", date: null }]);
  });
});