import { formatDuration } from "@/components/preview/TimelinePreview";
import { statusFromCode } from "@/lib/reviewMapper";
import type { TeamPendingDay } from "@/services/teamService";
import type { TeamMemberDto } from "@/types/reviewApi";
import type { ReviewStatus } from "@/types/review";

export type TeamMemberStatus = ReviewStatus | "Belum mulai" | "Status tidak diketahui" | "Cuti" | "Libur";

export type TeamPendingItem = {
  text: string;
  date: string | null;
  autoSubmitted?: boolean;
};

export type TeamMemberRow = {
  id: number;
  name: string;
  initial: string;
  jenis: string;
  status: TeamMemberStatus;
  hours: string;
  pending: TeamPendingItem[];
  date: string | null;
  pendingDays: number;
};

export function mapTeamMember(dto: TeamMemberDto): TeamMemberRow {
  const name = dto.fullName?.trim() || "Pengguna";
  const statusCode = dto.status?.trim().toUpperCase() ?? "";
  const status = mapStatus(statusCode);
  const pendingDays = finiteNonNegativeNumber(dto.pendingDays) ? dto.pendingDays : 0;
  const date = isDateKey(dto.date) ? dto.date : null;
  const pending: TeamPendingItem[] = [];
  const hasTodayPendingLog = statusCode === "MENUNGGU" && dto.dailyLogId != null;

  if (hasTodayPendingLog && date) {
    const minutes = finiteNonNegativeNumber(dto.totalDurationMinutes)
      ? dto.totalDurationMinutes
      : 0;
    pending.push({
      text: `${formatPendingDate(date)} · ${formatHours(minutes)}`,
      date,
    });
  }

  const remainingPendingDays = pendingDays - (hasTodayPendingLog ? 1 : 0);
  if (remainingPendingDays > 0) {
    pending.push({ text: `${remainingPendingDays} hari menunggu`, date: null });
  }

  const durationMinutes = finiteNonNegativeNumber(dto.totalDurationMinutes)
    ? dto.totalDurationMinutes
    : 0;

  return {
    id: finiteNonNegativeNumber(dto.userId) ? dto.userId : 0,
    name,
    initial: name.charAt(0).toLocaleUpperCase("id-ID"),
    jenis: mapJenis(dto.jenis),
    status,
    hours: formatHours(durationMinutes),
    pending,
    date,
    pendingDays,
  };
}

export function mapPendingDaysByUser(days: TeamPendingDay[]): Map<number, TeamPendingItem[]> {
  const grouped = new Map<number, TeamPendingItem[]>();

  for (const day of days) {
    const items = grouped.get(day.userId) ?? [];
    const duration = day.totalDurationMinutes == null
      ? ""
      : ` · ${formatHours(day.totalDurationMinutes)}`;
    items.push({
      text: `${formatPendingDate(day.date)}${duration}`,
      date: day.date,
      autoSubmitted: day.autoSubmitted,
    });
    grouped.set(day.userId, items);
  }

  for (const items of grouped.values()) {
    items.sort((left, right) => (left.date ?? "").localeCompare(right.date ?? ""));
  }

  return grouped;
}

function mapStatus(code: string): TeamMemberStatus {
  if (code === "BELUM_MULAI") return "Belum mulai";
  if (code === "CUTI") return "Cuti";
  if (code === "LIBUR") return "Libur";
  return statusFromCode(code) ?? "Status tidak diketahui";
}

function mapJenis(value: string | null | undefined): string {
  switch (value?.trim().toUpperCase()) {
    case "MAGANG":
      return "Magang";
    case "PKL":
      return "PKL";
    case "KARYAWAN":
      return "Karyawan";
    default:
      return "Lainnya";
  }
}

function formatHours(minutes: number): string {
  return minutes === 0 ? "0 j" : formatDuration(minutes);
}

function formatPendingDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!isDateKey(date) || monthLabels[month - 1] == null) return date;
  const adjustedYear = month < 3 ? year - 1 : year;
  const weekday = (adjustedYear + Math.floor(adjustedYear / 4) - Math.floor(adjustedYear / 100)
    + Math.floor(adjustedYear / 400) + weekdayOffsets[month - 1] + day) % 7;
  return `${weekdayLabels[weekday]} ${day} ${monthLabels[month - 1]}`;
}

function isDateKey(value: string | null | undefined): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth[month - 1];
}

const weekdayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const weekdayOffsets = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function finiteNonNegativeNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}