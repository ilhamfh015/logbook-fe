import { apiFetch } from "@/services/apiClient";
import type { AdminDailyLogDto, DailyLogDecisionResponse } from "@/types/reviewApi";

export type AdminHoliday = {
  id: number;
  holiday_date: string;
  name: string;
};

export type AdminTalent = {
  id: number;
  full_name: string;
};

export type AdminLeave = {
  id: number;
  user_id: number;
  full_name: string | null;
  start_date: string;
  end_date: string;
  note: string | null;
};

export type AdminImportResponse = {
  created: number;
  updated: number;
  importedEmails: string[];
};

export type AdminDailyLogFilters = {
  date?: string | null;
  userId?: number | string | null;
  status?: string | null;
};

/** Aksi keputusan Daily Log yang boleh dilakukan Admin. */
export type AdminDailyLogDecision = "approve" | "reject" | "approve-revision";

export const adminService = {
  getTalentOptions: () => apiFetch<AdminTalent[]>("/api/admin/users"),

  importUsers: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return apiFetch<AdminImportResponse>("/api/admin/users/import", {
      method: "POST",
      body: formData,
    });
  },

  getAdminDailyLogs: (filters: AdminDailyLogFilters = {}) => {
    const params = new URLSearchParams();
    const { date, userId, status } = filters;

    if (date) params.set("date", date);
    if (typeof userId === "number" && Number.isFinite(userId)) {
      params.set("userId", String(userId));
    } else if (typeof userId === "string" && userId.trim()) {
      params.set("userId", userId.trim());
    }
    if (status) params.set("status", status);

    const query = params.toString();
    return apiFetch<AdminDailyLogDto[]>(
      `/api/admin/daily-logs${query ? `?${query}` : ""}`,
    );
  },

  decideDailyLog: (
    dailyLogId: number,
    decision: AdminDailyLogDecision,
    reason?: string,
  ) =>
    apiFetch<DailyLogDecisionResponse>(
      `/api/daily-logs/${dailyLogId}/${decision}`,
      {
        method: "POST",
        ...(reason === undefined ? {} : { body: JSON.stringify({ reason }) }),
      },
    ),

  getHolidays: () => apiFetch<AdminHoliday[]>("/api/admin/holidays"),

  addHoliday: (date: string, name: string) =>
    apiFetch<{ message: string }>("/api/admin/holidays", {
      method: "POST",
      body: JSON.stringify({ date, name }),
    }),

  deleteHoliday: (date: string) =>
    apiFetch<{ message: string }>(`/api/admin/holidays/${encodeURIComponent(date)}`, {
      method: "DELETE",
    }),

  getLeaves: () => apiFetch<AdminLeave[]>("/api/admin/leaves"),

  addLeave: (userId: number, fromDate: string, toDate: string, note: string) =>
    apiFetch<{ message: string }>("/api/admin/leaves", {
      method: "POST",
      body: JSON.stringify({
        userId: String(userId),
        fromDate,
        toDate,
        note,
      }),
    }),

  deleteLeave: (id: number) =>
    apiFetch<{ message: string }>(`/api/admin/leaves/${id}`, {
      method: "DELETE",
    }),
};
