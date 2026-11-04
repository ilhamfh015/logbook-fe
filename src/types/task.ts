
export type ProjectColor = string;
export type WorkStatus = "SELESAI" | "BERJALAN" | "TERTAHAN";
export type TaskType = "Pengembangan" | "Perbaikan bug" | "Rapat" | "Review" | "Belajar" | "Istirahat" | "Lainnya";

export type TaskDraft = {
  id?: string;
  date?: string;
  deletedAt?: string;
  project: string;
  projectColor: ProjectColor;
  ticket: string;
  startTime: string;
  durationMinutes: number;
  type: TaskType;
  summary: string;
  workStatus: WorkStatus;
};
