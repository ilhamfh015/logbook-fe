import { apiFetch } from "@/services/apiClient";
import type { DailyLogApi } from "@/types/task";

export const dailyLogService = {
  getDailyLog: (date: string): Promise<DailyLogApi> => {
    return apiFetch<DailyLogApi>(
      `/api/daily-logs?date=${encodeURIComponent(date)}`,
    );
  },
};