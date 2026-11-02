export type ProjectColor = "blue" | "orange";
export type WorkStatus = "SELESAI" | "BERJALAN" | "TERTAHAN";
export type TaskType = "Pengembangan" | "Perbaikan bug" | "Rapat" | "Review" | "Belajar" | "Istirahat" | "Lainnya";

export type TaskDraft = {
  project: string;
  ticket: string;
  startTime: string;
  durationMinutes: number;
  type: TaskType;
  summary: string;
  workStatus: WorkStatus;
};
