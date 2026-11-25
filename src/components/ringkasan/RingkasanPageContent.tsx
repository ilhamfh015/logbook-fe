"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MessageSquareWarning,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatClock } from "@/lib/taskTime";
import { ApiError } from "@/services/apiClient";
import { summaryService } from "@/services/summaryService";
import type {
  SummaryPeriod,
  SummaryResponse,
  SummaryTaskItem,
} from "@/types/summary";

const periodOptions: { value: SummaryPeriod; label: string }[] = [
  { value: "WEEK", label: "Mingguan" },
  { value: "MONTH", label: "Bulanan" },
];

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMinutes(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  if (hours === 0) return `${minutes} menit`;
  if (minutes === 0) return `${hours} jam`;
  return `${hours} jam ${minutes} menit`;
}

function formatDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatShortDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(parsed);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan. Silakan coba lagi.";
}

export function RingkasanPageContent() {
  const { loading: authLoading } = useAuth();
  const [period, setPeriod] = useState<SummaryPeriod>("WEEK");
  const [date, setDate] = useState<string>(todayIso);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);

  const loadSummary = useCallback(async (targetPeriod: SummaryPeriod, targetDate: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await summaryService.getSummary(targetPeriod, targetDate || undefined);
      setSummary(data);
    } catch (err) {
      setError(getErrorMessage(err));
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void loadSummary(period, date);
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, loadSummary, period, date]);

  if (authLoading) {
    return <LoadingState label="Memeriksa akses..." />;
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 py-7 pb-28 lg:px-8 lg:pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-brand">
            <BarChart3 size={21} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Ringkasanku</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Rekap aktivitas kerja mingguan dan bulanan berdasarkan catatan logbook Anda.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadSummary(period, date)}
          disabled={loading}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Muat ulang
        </button>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Periode</p>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Pilih periode">
              {periodOptions.map((option) => {
                const active = option.value === period;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPeriod(option.value)}
                    aria-pressed={active}
                    className={`min-h-9 rounded-md px-4 text-sm font-semibold transition ${
                      active
                        ? "bg-white text-brand shadow-sm"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Tanggal acuan</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="field-control min-h-10 w-full sm:w-52"
            />
          </label>
        </div>
      </section>

      {error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Gagal memuat ringkasan</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <LoadingState label="Memuat ringkasan..." />
      ) : summary ? (
        <SummaryContent summary={summary} />
      ) : null}
    </main>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-sm text-slate-500">
      <LoaderCircle size={18} className="animate-spin text-brand" />
      <span>{label}</span>
    </div>
  );
}

function SummaryContent({ summary }: { summary: SummaryResponse }) {
  const hasData =
    summary.daysRecorded > 0 ||
    summary.perType.length > 0 ||
    summary.perProject.length > 0 ||
    summary.done.length > 0 ||
    summary.ongoing.length > 0 ||
    summary.obstacles.length > 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Clock3 size={18} />} label="Total waktu" value={formatMinutes(summary.totalMinutes)} />
        <StatCard icon={<CalendarDays size={18} />} label="Hari tercatat" value={`${summary.daysRecorded} hari`} />
        <StatCard icon={<Briefcase size={18} />} label="Hari kerja" value={`${summary.workdays} hari`} />
      </section>

      {!hasData ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-700">Belum ada data ringkasan</p>
          <p className="mt-1 text-sm text-slate-500">
            Catatan logbook pada periode ini akan muncul di sini.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownCard
          title="Per jenis task"
          emptyText="Belum ada data jenis task."
          items={summary.perType.map((item) => ({
            key: item.name,
            label: item.name,
            value: formatMinutes(item.minutes),
            minutes: item.minutes,
            color: null,
          }))}
          totalMinutes={summary.totalMinutes}
        />
        <BreakdownCard
          title="Per proyek"
          emptyText="Belum ada data proyek."
          items={summary.perProject.map((item) => ({
            key: item.name,
            label: item.name,
            value: formatMinutes(item.minutes),
            minutes: item.minutes,
            color: item.color,
          }))}
          totalMinutes={summary.totalMinutes}
        />
      </div>

      <TaskListCard title="Selesai" icon={<CheckCircle2 size={18} className="text-emerald-600" />} emptyText="Belum ada task selesai." tasks={summary.done} />
      <TaskListCard title="Sedang berjalan" icon={<Clock3 size={18} className="text-amber-600" />} emptyText="Belum ada task sedang berjalan." tasks={summary.ongoing} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <MessageSquareWarning size={18} className="text-rose-600" />
          <h2 className="text-base font-bold text-ink">Kendala</h2>
        </div>
        {summary.obstacles.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Tidak ada kendala tercatat.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {summary.obstacles.map((item) => (
              <li key={`${item.taskId}-${item.date}`} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>{formatDate(item.date)}</span>
                  {item.project ? <span className="font-medium text-slate-700">{item.project}</span> : null}
                  {item.ticket ? <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-600">{item.ticket}</span> : null}
                </div>
                <p className="mt-1 text-sm text-slate-700">{item.obstacle || "-"}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-ink">Hari dengan ringkasan singkat</h2>
        <p className="mt-1 text-sm text-slate-500">Informasi netral untuk membantu melengkapi catatan, tanpa skor.</p>
        {summary.shortSummaryDays.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Tidak ada hari dengan ringkasan singkat pada periode ini.</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {summary.shortSummaryDays.map((item) => (
              <span
                key={item.date}
                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800"
              >
                <span>{formatShortDate(item.date)}</span>
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px]">{item.count} task</span>
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        <span className="text-brand">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-ink">{value}</p>
    </div>
  );
}

type BreakdownItem = {
  key: string;
  label: string;
  value: string;
  minutes: number;
  color: string | null;
};

function BreakdownCard({
  title,
  emptyText,
  items,
  totalMinutes,
}: {
  title: string;
  emptyText: string;
  items: BreakdownItem[];
  totalMinutes: number;
}) {
  const max = Math.max(totalMinutes, ...items.map((item) => item.minutes), 1);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-ink">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {items.map((item) => {
            const width = Math.max(4, Math.round((item.minutes / max) * 100));
            return (
              <li key={item.key}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color || "#0A6FD6" }}
                      aria-hidden="true"
                    />
                    <span className="truncate font-medium text-slate-700">{item.label}</span>
                  </div>
                  <span className="shrink-0 text-slate-500">{item.value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${width}%`, backgroundColor: item.color || "#0A6FD6" }}
                    aria-hidden="true"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function TaskListCard({
  title,
  icon,
  emptyText,
  tasks,
}: {
  title: string;
  icon: React.ReactNode;
  emptyText: string;
  tasks: SummaryTaskItem[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-base font-bold text-ink">{title}</h2>
        <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          {tasks.length}
        </span>
      </div>
      {tasks.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {tasks.map((task) => (
            <li key={`${task.taskId}-${task.date}`} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span>{formatDate(task.date)}</span>
                    {task.project ? <span className="font-medium text-slate-700">{task.project}</span> : null}
                    {task.ticket ? <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">{task.ticket}</span> : null}
                    {task.type ? <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-brand">{task.type}</span> : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{task.summary || "-"}</p>
                </div>
                <div className="shrink-0 text-right text-xs text-slate-500">
                  {task.startMinute != null ? <div>{formatClock(task.startMinute)}</div> : null}
                  {task.durationMinutes != null ? <div>{formatMinutes(task.durationMinutes)}</div> : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
