import { apiFetch } from "@/services/apiClient";
import type { TeamMemberDto, TeamPendingDayDto } from "@/types/reviewApi";

export type TeamScope = "ATASAN" | "ADMIN";

export type TeamPendingDay = {
  userId: number;
  dailyLogId: number | null;
  date: string;
  totalDurationMinutes: number | null;
  submittedAt: string | null;
  autoSubmitted: boolean;
};

export async function getTeam(scope: TeamScope = "ATASAN"): Promise<TeamMemberDto[]> {
  const response = await apiFetch<unknown>(`/api/team?scope=${scope}`);
  return Array.isArray(response) ? response as TeamMemberDto[] : [];
}

export async function getPendingDays(): Promise<TeamPendingDay[]> {
  const response = await apiFetch<unknown>("/api/team/pending-days");
  if (!Array.isArray(response)) return [];

  return response.flatMap((item: TeamPendingDayDto | null) => {
    if (!item || typeof item !== "object" || !isPositiveInteger(item.userId) || !isDateKey(item.date)) {
      return [];
    }

    return [{
      userId: item.userId,
      dailyLogId: isPositiveInteger(item.dailyLogId) ? item.dailyLogId : null,
      date: item.date,
      totalDurationMinutes: isNonNegativeNumber(item.totalDurationMinutes)
        ? item.totalDurationMinutes
        : null,
      submittedAt: typeof item.submittedAt === "string" ? item.submittedAt : null,
      autoSubmitted: item.autoSubmitted === true,
    }];
  });
}

function isPositiveInteger(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isNonNegativeNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isDateKey(value: string | null | undefined): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1];
}
