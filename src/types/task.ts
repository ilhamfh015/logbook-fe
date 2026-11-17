
export type ProjectColor = string;

export type WorkStatus = "SELESAI" | "BERJALAN" | "TERTAHAN";

export type TaskType = string;

// Tipe data untuk penyimpanan task di frontend
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
  /** Menit mulai absolut dari 00.00 tanggal Daily Log (0 - 2879). */
  startMinute?: number;
  durationMinutes: number;
  type: TaskType;
  summary: string;
  obstacle?: string;
  workStatus: WorkStatus;
};

// Respons task dari backend
export type DailyLogTaskApi = {
  id: number;
  projectId: number;
  taskTypeId: number;
  workStatusId: number;
  ticket: string | null;
  startTime: string;
  startMinute: number;
  durationMinutes: number;
  summary: string;
  obstacle: string | null;
};

// Respons proyek di dalam Daily Log
export type DailyLogProjectApi = {
  projectId: number;
  subtotalMinutes: number;
  tasks: DailyLogTaskApi[];
};

// Respons GET Daily Log
export type DailyLogApi = {
  id: number;
  userId: number;
  logDate: string;
  status: string;
  totalDurationMinutes: number;
  projects: DailyLogProjectApi[];
  tasks: DailyLogTaskApi[];
};

// Respons GET Master Proyek
export type ProjectApi = {
  project_id: number;
  project_name: string;
  client_name: string;
  color: string;
};
