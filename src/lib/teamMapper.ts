import { formatDuration } from "@/components/preview/TimelinePreview";
import { statusFromCode } from "@/lib/reviewMapper";
import type { TeamMemberDto } from "@/types/reviewApi";
import type { ReviewStatus } from "@/types/review";

export type TeamMemberStatus = ReviewStatus | "Belum mulai" | "Status tidak diketahui" | "Cuti" | "Libur";

export type TeamPendingItem = {
  text: string;
  date: string | null;
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
  const parsedDate = new Date(`${date}T12:00:00+07:00`);
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(parsedDate);
}

function isDateKey(value: string | null | undefined): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function finiteNonNegativeNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}