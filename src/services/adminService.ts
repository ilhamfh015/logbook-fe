import { apiFetch } from "@/services/apiClient";

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

export const adminService = {
  getTalentOptions: () => apiFetch<AdminTalent[]>("/api/admin/users"),

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
