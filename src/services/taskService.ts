import { apiFetch } from "@/services/apiClient";
import type { TaskDraft } from "@/types/task";

export type ProjectOption = {
  project_id: number;
  project_name: string;
  client_name: string;
  color: string;
};

export type TaskTypeOption = { id: number; name: string };
export type WorkStatusOption = { id: number; name: string };
export type DurationOption = { minutes: number; label: string };

export type TaskMasterData = {
  types: TaskTypeOption[];
  statuses: WorkStatusOption[];
  durations: DurationOption[];
};

export type ApiTask = {
  id: number;
  projectId: number;
  taskTypeId: number;
  workStatusId: number;
  ticket: string | null;
  startTime: string;
  durationMinutes: number;
  summary: string;
  obstacle: string | null;
};

/**
 * Saran "Lanjutkan" dari GET /api/continue: task Berjalan/Tertahan pada hari
 * terakhir yang berisi catatan. Berbeda dari {@link ApiTask}, bentuk ini
 * memakai nama (bukan id) karena dipakai untuk mengisi form.
 */
export type ContinueTask = {
  id: number;
  project: string | null;
  color: string | null;
  ticket: string | null;
  startMinute: number | null;
  durationMinutes: number;
  type: string | null;
  summary: string;
  workStatus: string | null;
  obstacle: string | null;
};

export type DayInfo = {
  date: string;
  holidayName: string | null;
  onLeave: boolean;
  weekend: boolean;
  workingDay: boolean;
};

export type DailyLog = {
  id: number;
  logDate: string;
  status: string;
  submittedAt: string | null;
  rejectionReason: string | null;
  decidedByUserId: number | null;
  decidedAt: string | null;
  autoSubmitted: boolean;
  editable: boolean;
  deadline: string | null;
  totalDurationMinutes: number;
  tasks: ApiTask[];
  day?: DayInfo;
};

type TaskRequest = {
  projectId: number;
  taskTypeId: number;
  workStatusId: number;
  ticket: string | null;
  startTime: string;
  durationMinutes: number;
  summary: string;
  obstacle: string | null;
};

export const taskService = {
  getProjects: () => apiFetch<ProjectOption[]>("/api/projects"),

  getContinueTasks: () => apiFetch<ContinueTask[]>("/api/continue"),

  getMasterData: () => apiFetch<TaskMasterData>("/api/tasks/master-data"),

  getCalendar: (from: string, to: string, userId?: number) => {
    const params = new URLSearchParams({ from, to });
    if (userId !== undefined) params.set("userId", String(userId));
    return apiFetch<DayInfo[]>(`/api/calendar?${params.toString()}`);
  },

  getDailyLog: (date: string) =>
    apiFetch<DailyLog>(`/api/daily-logs?date=${encodeURIComponent(date)}`),

  createDailyLog: (date: string) =>
    apiFetch<DailyLog>(`/api/daily-logs?date=${encodeURIComponent(date)}`, {
      method: "POST",
    }),

  submitDailyLog: (dailyLogId: number) =>
    apiFetch<DailyLog>(`/api/daily-logs/${dailyLogId}/submit`, {
      method: "POST",
    }),

  withdrawDailyLog: (dailyLogId: number) =>
    apiFetch<DailyLog>(`/api/daily-logs/${dailyLogId}/withdraw`, {
      method: "POST",
    }),

  create: (dailyLogId: number, task: TaskDraft) =>
    apiFetch<ApiTask>(`/api/daily-logs/${dailyLogId}/tasks`, {
      method: "POST",
      body: JSON.stringify(toTaskRequest(task)),
    }),

  update: (taskId: number, task: TaskDraft) =>
    apiFetch<ApiTask>(`/api/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(toTaskRequest(task)),
    }),

  delete: (taskId: number) =>
    apiFetch<void>(`/api/tasks/${taskId}`, { method: "DELETE" }),
};

function toTaskRequest(task: TaskDraft): TaskRequest {
  if (
    task.projectId === undefined
    || task.taskTypeId === undefined
    || task.workStatusId === undefined
  ) {
    throw new Error("Pilih proyek, jenis task, dan status dari data yang tersedia.");
  }

  return {
    projectId: task.projectId,
    taskTypeId: task.taskTypeId,
    workStatusId: task.workStatusId,
    ticket: task.ticket || null,
    startTime: task.startTime,
    durationMinutes: task.durationMinutes,
    summary: task.summary,
    obstacle: task.obstacle?.trim() || null,
  };
}
