
export type ProjectColor = string;
export type WorkStatus = "SELESAI" | "BERJALAN" | "TERTAHAN";
export type TaskType = string;

export type TaskDraft = {
  id?: string;
  date?: string;
  deletedAt?: string;
  projectId?: number;
  taskTypeId?: number;
  workStatusId?: number;
  project: string;
  projectColor: ProjectColor;
  ticket: string;
  startTime: string;
  durationMinutes: number;
  type: TaskType;
  summary: string;
  obstacle?: string;
  workStatus: WorkStatus;
};
