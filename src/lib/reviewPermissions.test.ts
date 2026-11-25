import { describe, expect, it } from "vitest";
import { getReviewActions } from "@/lib/reviewPermissions";
import type { AuthUser, UserRole } from "@/types/auth";
import type { ReviewDailyLog, ReviewStatus } from "@/types/review";

const log: ReviewDailyLog = {
  id: 12,
  userId: 20,
  talentName: "Rina",
  talentJenis: "PKL",
  supervisorName: null,
  supervisorEmail: null,
  logDate: "2026-11-25",
  status: "Menunggu",
  submittedAt: null,
  autoSubmitted: false,
  rejectionReason: null,
  revisionReason: null,
  decidedByName: null,
  decidedAt: null,
  totalDurationMinutes: 60,
  tasks: [],
};

function makeUser(roles: UserRole[], id = 10): AuthUser {
  return {
    id,
    email: "reviewer@example.test",
    fullName: "Reviewer",
    jenis: null,
    emailAtasan: null,
    admin: roles.includes("ADMIN"),
    mustChangePassword: false,
    roles,
  };
}

describe("getReviewActions", () => {
  it.each([
    ["ATASAN", ["ATASAN"], true, true, false],
    ["ADMIN", ["ADMIN"], true, true, false],
    ["TALENT", ["TALENT"], false, false, false],
    ["peran kosong", [], false, false, false],
  ] as const)("menentukan aksi untuk %s", (_label, roles, canApprove, canReject, canApproveCorrection) => {
    const actions = getReviewActions(log, makeUser([...roles]));
    expect(actions).toMatchObject({ canApprove, canReject, canApproveCorrection });
  });

  it.each([
    ["Menunggu", true, true, false],
    ["Perbaikan diajukan", false, false, true],
    ["Disetujui", false, false, false],
    ["Ditolak", false, false, false],
    ["Draf", false, false, false],
    ["Draf dibuka kembali", false, false, false],
    ["Terlewat", false, false, false],
    [null, false, false, false],
  ] as const)("menerapkan aksi sesuai status %s", (status, canApprove, canReject, canApproveCorrection) => {
    const actions = getReviewActions({ ...log, status: status as ReviewStatus | null }, makeUser(["ATASAN"]));
    expect(actions).toMatchObject({ canApprove, canReject, canApproveCorrection });
  });

  it("menyembunyikan aksi untuk log milik reviewer", () => {
    const actions = getReviewActions(log, makeUser(["ADMIN"], log.userId));

    expect(actions).toMatchObject({ canApprove: false, canReject: false, canApproveCorrection: false });
  });

  it("tidak menyembunyikan aksi ketika id reviewer atau talent tidak diketahui", () => {
    const unknownReviewer = { ...makeUser(["ATASAN"]), id: undefined } as unknown as AuthUser;
    const unknownTalent = { ...log, userId: undefined } as unknown as ReviewDailyLog;

    expect(getReviewActions(log, unknownReviewer).canApprove).toBe(true);
    expect(getReviewActions(unknownTalent, makeUser(["ATASAN"])).canApprove).toBe(true);
  });

  it.each(["Menunggu", "Perbaikan diajukan"] as const)(
    "menampilkan pesan netral dan tanpa aksi untuk status %s tanpa id Daily Log",
    (status) => {
      const actions = getReviewActions({ ...log, id: null, status }, makeUser(["ATASAN"]));

      expect(actions).toMatchObject({
        canApprove: false,
        canReject: false,
        canApproveCorrection: false,
        reason: "Keputusan untuk tanggal ini belum dapat dilakukan dari halaman ini.",
      });
    },
  );
});