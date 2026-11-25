"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TimelinePreview, formatDuration } from "@/components/preview/TimelinePreview";
import { ReviewDecisionPanel } from "@/components/review/ReviewDecisionPanel";
import { ApiError } from "@/services/apiClient";
import { getTalentDailyLog } from "@/services/reviewService";
import type { ReviewDailyLog, ReviewStatus } from "@/types/review";

type DailyLogReviewProps = {
  userId: string;
  dateIso: string;
};

const statusClassNames: Record<ReviewStatus, string> = {
  Menunggu: "bg-amber-100 text-amber-900",
  Disetujui: "bg-teal-100 text-teal-900",
  Ditolak: "bg-violet-100 text-violet-900",
  Draf: "bg-slate-100 text-slate-700",
  "Perbaikan diajukan": "bg-cyan-100 text-cyan-900",
  "Draf dibuka kembali": "bg-slate-100 text-slate-700",
  Terlewat: "border border-dashed border-slate-400 bg-white text-slate-700",
};

export function DailyLogReview({ userId, dateIso }: DailyLogReviewProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [requestResult, setRequestResult] = useState<{
    key: string;
    log: ReviewDailyLog | null;
    errorMessage: string;
  }>({ key: "", log: null, errorMessage: "" });
  const [override, setOverride] = useState<{ key: string; log: ReviewDailyLog } | null>(null);
  const requestKey = `${userId}:${dateIso}:${retryCount}`;

  useEffect(() => {
    let active = true;

    getTalentDailyLog(userId, dateIso)
      .then((result) => {
        if (active) setRequestResult({ key: requestKey, log: result, errorMessage: "" });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Daily Log belum dapat dimuat.";
        setRequestResult({ key: requestKey, log: null, errorMessage: message });
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [dateIso, requestKey, userId]);

  const loading = requestResult.key !== requestKey;
  const log = loading
    ? null
    : override?.key === requestKey
      ? override.log
      : requestResult.log;
  const errorMessage = loading ? "" : requestResult.errorMessage;

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] min-w-0 flex-1 items-start p-6 text-sm text-slate-600" role="status">
        Memuat Daily Log...
      </div>
    );
  }

  if (errorMessage || !log) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] min-w-0 flex-1 flex-col items-start gap-4 p-6">
        <p className="text-sm text-slate-700" role="alert">
          {errorMessage || "Daily Log belum dapat dimuat."}
        </p>
        <button
          type="button"
          onClick={() => setRetryCount((count) => count + 1)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  const logDate = new Date(`${log.logDate}T12:00:00+07:00`);
  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(logDate);
  const submittedLabel = log.autoSubmitted
    ? "Dikirim otomatis"
    : log.submittedAt
      ? new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(log.submittedAt))
      : "Belum dikirim";

  return (
    <div className="flex min-h-[calc(100vh-64px)] min-w-0 flex-1 flex-col lg:flex-row">
      <main className="min-w-0 flex-1">
        <div className="px-4 pt-5 sm:px-5 lg:px-7">
          <Link href="/atasan/tim" className="text-sm font-medium text-blue-700 underline underline-offset-2">
            ‹ Kembali ke Tim
          </Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-ink sm:text-2xl">
                {log.talentName} · {formattedDate}
              </h1>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                Hanya baca
              </span>
            </div>
          </div>
        </div>
        <TimelinePreview
          date={logDate}
          onChangeDate={() => undefined}
          onAddTask={() => undefined}
          savedTasks={log.tasks}
          onEditTask={() => undefined}
          onDeleteTask={() => undefined}
          loading={false}
          emptyMessage=""
          status={null}
          day={null}
          submittedAt={log.submittedAt}
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
      </main>

      <aside className="w-full shrink-0 border-t border-slate-200 bg-white p-5 lg:w-[340px] lg:basis-[340px] lg:border-l lg:border-t-0">
        <h2 className="text-lg font-bold text-ink">Informasi Daily Log</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <InfoRow label="Talent" value={`${log.talentName} · ${log.talentJenis}`} />
          <InfoRow label="Atasan" value={log.supervisorName} />
          <InfoRow label="Tanggal log" value={formattedDate} />
          <InfoRow label="Dikirim" value={submittedLabel} />
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-500">Status</dt>
            <dd>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassNames[log.status]}`}>
                {log.status}
              </span>
            </dd>
          </div>
          <InfoRow
            label="Total jam · task"
            value={`${formatDuration(log.totalDurationMinutes)} · ${log.tasks.length} task`}
          />
        </dl>

        {((log.status === "Ditolak" && log.rejectionReason)
          || ((log.status === "Perbaikan diajukan" || log.status === "Draf dibuka kembali") && log.revisionReason)) ? (
          <section className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            {log.status === "Ditolak" && log.rejectionReason ? (
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Alasan penolakan</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-600">{log.rejectionReason}</p>
              </div>
            ) : null}
            {(log.status === "Perbaikan diajukan" || log.status === "Draf dibuka kembali") && log.revisionReason ? (
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Alasan perbaikan dari talent</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-600">{log.revisionReason}</p>
              </div>
            ) : null}
          </section>
        ) : null}

        <ReviewDecisionPanel
          log={log}
          onUpdated={(updatedLog) => setOverride({ key: requestKey, log: updatedLog })}
        />
      </aside>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}