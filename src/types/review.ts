import type { DailyLog } from "@/services/taskService";
import type { AuthUser } from "@/types/auth";
import type { TaskDraft } from "@/types/task";

export type ReviewStatus =
  | "Draf"
  | "Menunggu"
  | "Disetujui"
  | "Ditolak"
  | "Terlewat"
  | "Perbaikan diajukan"
  | "Draf dibuka kembali";

// tasks sudah dalam bentuk TaskDraft (nama proyek, warna, jenis sudah ter-resolve) supaya langsung bisa dipakai linimasa. Pemetaan dari ApiTask ke TaskDraft dikerjakan saat integrasi API (jadwal baris 52).
export interface ReviewDailyLog {
  id: DailyLog["id"];
  userId: AuthUser["id"];
  talentName: string;
  talentJenis: string;
  supervisorName: string;
  supervisorEmail: string;
  logDate: string;
  status: ReviewStatus;
  submittedAt: string | null;
  autoSubmitted: boolean;
  rejectionReason: string | null;
  revisionReason: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
  totalDurationMinutes: number;
  tasks: TaskDraft[];
}

export type ReviewActionKind = "approve" | "reject" | "approveCorrection";