import { apiFetch } from "@/services/apiClient";
import type { SummaryPeriod, SummaryResponse } from "@/types/summary";

export const summaryService = {
  getSummary: (period: SummaryPeriod, date?: string): Promise<SummaryResponse> => {
    const params = new URLSearchParams({ period });
    if (date) params.set("date", date);
    return apiFetch<SummaryResponse>(`/api/summary?${params.toString()}`);
  },
};
