import type { AuthUser } from "@/types/auth";
import type { ReviewDailyLog } from "@/types/review";

type ReviewActions = {
  canApprove: boolean;
  canReject: boolean;
  canApproveCorrection: boolean;
  reason: string | null;
};

const noActions = (reason: string): ReviewActions => ({
  canApprove: false,
  canReject: false,
  canApproveCorrection: false,
  reason,
});

// Pemeriksaan ini hanya untuk UI; backend tetap wajib memvalidasi peran dan kepemilikan.
export function getReviewActions(
  log: ReviewDailyLog,
  user: AuthUser | null,
): ReviewActions {
  if (!user) {
    return noActions("Masuk untuk memutuskan Daily Log.");
  }

  if (log.userId === user.id) {
    return noActions("Kamu tidak dapat memutuskan Daily Log milikmu sendiri.");
  }

  if (user.admin !== true && user.email !== log.supervisorEmail) {
    return noActions("Hanya atasan langsung atau admin yang dapat memutuskan Daily Log ini.");
  }

  if (log.status === "Menunggu") {
    return {
      canApprove: true,
      canReject: true,
      canApproveCorrection: false,
      reason: null,
    };
  }

  if (log.status === "Perbaikan diajukan") {
    return {
      canApprove: false,
      canReject: false,
      canApproveCorrection: true,
      reason: null,
    };
  }

  switch (log.status) {
    case "Disetujui":
      return noActions("Daily Log ini sudah disetujui.");
    case "Ditolak":
      return noActions("Daily Log ini ditolak dan menunggu perbaikan talent.");
    case "Draf":
      return noActions("Daily Log ini masih berstatus Draf.");
    case "Draf dibuka kembali":
      return noActions("Daily Log ini dibuka kembali sebagai draf dan menunggu talent memperbaikinya.");
    case "Terlewat":
    default:
      return noActions("Daily Log ini belum bisa diputuskan.");
  }
}