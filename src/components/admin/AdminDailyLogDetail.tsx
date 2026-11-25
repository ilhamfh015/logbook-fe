"use client";

import { useEffect, useRef } from "react";
import { LoaderCircle, X } from "lucide-react";
import {
  TimelinePreview,
  formatDuration,
} from "@/components/preview/TimelinePreview";
import { tasksFromDay } from "@/lib/reviewMapper";
import type { DayDto } from "@/types/reviewApi";

type AdminDailyLogDetailProps = {
  open: boolean;
  fullName: string;
  dateIso: string;
  dateLabel: string;
  statusCode: string;
  statusLabel: string;
  submittedAt: string | null;
  rejectionReason: string | null;
  revisionReason: string | null;
  day: DayDto | null;
  loading: boolean;
  errorMessage: string;
  onClose: () => void;
};

export function AdminDailyLogDetail({
  open,
  fullName,
  dateIso,
  dateLabel,
  statusCode,
  statusLabel,
  submittedAt,
  rejectionReason,
  revisionReason,
  day,
  loading,
  errorMessage,
  onClose,
}: AdminDailyLogDetailProps) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!open) return null;

  const parsedDate = new Date(`${dateIso}T12:00:00+07:00`);
  const date = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  const tasks = tasksFromDay(day);
  const totalMinutes =
    typeof day?.totalMinutes === "number" && Number.isFinite(day.totalMinutes)
      ? day.totalMinutes
      : null;

  return (
    <>
      <button
        type="button"
        aria-label="Tutup detail Daily Log"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default bg-slate-900/20"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Detail Daily Log ${fullName}`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-ink">{fullName}</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                Hanya baca
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {dateLabel} · Status: {statusLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <p
              role="status"
              className="flex items-center gap-2 text-sm text-slate-500"
            >
              <LoaderCircle size={16} className="animate-spin text-brand" />
              Memuat detail Daily Log...
            </p>
          ) : null}

          {!loading && errorMessage ? (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {errorMessage}
            </p>
          ) : null}

          {!loading && !errorMessage && day ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-800">
                  Total {formatDuration(totalMinutes ?? 0)}
                </span>
                <span>
                  {tasks.length} task
                </span>
                {day.dayLabel ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {day.dayLabel}
                  </span>
                ) : null}
              </div>

              {rejectionReason ? (
                <p className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
                  <strong>Alasan penolakan: </strong>
                  {rejectionReason}
                </p>
              ) : null}

              {revisionReason ? (
                <p className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
                  <strong>Alasan revisi: </strong>
                  {revisionReason}
                </p>
              ) : null}

              {tasks.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Tidak ada task pada Daily Log ini.
                </p>
              ) : (
                <TimelinePreview
                  date={date}
                  onChangeDate={() => undefined}
                  onAddTask={() => undefined}
                  savedTasks={tasks}
                  onEditTask={() => undefined}
                  onDeleteTask={() => undefined}
                  loading={false}
                  emptyMessage=""
                  status={statusCode}
                  day={null}
                  submittedAt={submittedAt}
                  readOnly
                  lockMessage={null}
                  deadlineLabel={null}
                  rejectionReason={null}
                  canWithdraw={false}
                  canSubmit={false}
                  submitting={false}
                  onSubmit={() => undefined}
                  withdrawing={false}
                  onWithdraw={() => undefined}
                  variant="review"
                />
              )}
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
