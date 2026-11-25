export type SummaryPeriod = "WEEK" | "MONTH";

export type SummaryTypeItem = {
  name: string;
  minutes: number;
};

export type SummaryProjectItem = {
  name: string;
  color: string | null;
  minutes: number;
};

export type SummaryTaskItem = {
  date: string;
  taskId: number;
  project: string | null;
  color: string | null;
  ticket: string | null;
  type: string | null;
  summary: string | null;
  workStatus: string | null;
  startMinute: number | null;
  durationMinutes: number | null;
};

export type SummaryObstacleItem = {
  date: string;
  taskId: number;
  project: string | null;
  ticket: string | null;
  obstacle: string | null;
};

export type SummaryShortDayItem = {
  date: string;
  count: number;
};

export type SummaryResponse = {
  totalMinutes: number;
  daysRecorded: number;
  workdays: number;
  perType: SummaryTypeItem[];
  perProject: SummaryProjectItem[];
  done: SummaryTaskItem[];
  ongoing: SummaryTaskItem[];
  obstacles: SummaryObstacleItem[];
  shortSummaryDays: SummaryShortDayItem[];
};
