"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { CheckCircle2, Eye, LoaderCircle, RotateCcw, Search } from "lucide-react";
import { AdminDailyLogDetail } from "@/components/admin/AdminDailyLogDetail";
import { useAuth } from "@/components/auth/AuthProvider";
import { Dialog } from "@/components/shared/Dialog";
import { statusFromCode } from "@/lib/reviewMapper";
import {
  REJECTION_REASON_MAX,
  validateRejectionReason,
} from "@/lib/reviewValidation";
import { ApiError } from "@/services/apiClient";
import {
  adminService,
  type AdminDailyLogDecision,
  type AdminDailyLogFilters,
  type AdminTalent,
} from "@/services/adminService";
import type { AdminDailyLogDto, DayDto } from "@/types/reviewApi";

type FilterForm = {
  date: string;
  userId: string;
  status: string;
};

type DecisionTarget = {
  id: number;
  talentName: string;
  logDate: string;
  action: AdminDailyLogDecision;
};

type DetailTarget = {
  userId: number;
  fullName: string;
  dateIso: string;
  dateLabel: string;
  statusCode: string;
  statusLabel: string;
  submittedAt: string | null;
  rejectionReason: string | null;
  revisionReason: string | null;
};

const EMPTY_FILTERS: FilterForm = { date: "", userId: "", status: "" };

const STATUS_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "", label: "Semua status" },
  { value: "MENUNGGU", label: "Menunggu" },
  { value: "DISETUJUI", label: "Disetujui" },
  { value: "DITOLAK", label: "Ditolak" },
  { value: "PERBAIKAN_DIAJUKAN", label: "Perbaikan diajukan" },
  { value: "DRAF", label: "Draf" },
  { value: "TERLEWAT", label: "Terlewat" },
  { value: "DRAF_DIBUKA_KEMBALI", label: "Draf dibuka kembali" },
];

const DECISION_TITLES: Record<AdminDailyLogDecision, string> = {
  approve: "Setujui Daily Log?",
  reject: "Tolak Daily Log?",
  "approve-revision": "Setujui revisi Daily Log?",
};

const DECISION_CONFIRMS: Record<AdminDailyLogDecision, string> = {
  approve: "Setujui",
  reject: "Tolak",
  "approve-revision": "Setujui revisi",
};

const DECISION_NOTICES: Record<AdminDailyLogDecision, string> = {
  approve: "Daily Log berhasil disetujui.",
  reject: "Daily Log berhasil ditolak.",
  "approve-revision": "Revisi berhasil disetujui.",
};

const LOAD_ERROR =
  "Daftar Daily Log belum dapat dimuat. Periksa koneksi lalu coba lagi.";
const DECISION_ERROR = "Keputusan gagal disimpan. Silakan coba lagi.";
const DETAIL_ERROR = "Detail Daily Log belum dapat dimuat. Silakan coba lagi.";

const fieldClass =
  "field-control min-h-10 disabled:cursor-not-allowed disabled:bg-slate-50";

export function AdminDailyLogPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.roles.includes("ADMIN") ?? false;

  const [logs, setLogs] = useState<AdminDailyLogDto[]>([]);
  const [talents, setTalents] = useState<AdminTalent[]>([]);
  const [filters, setFilters] = useState<FilterForm>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AdminDailyLogFilters>({});
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [decisionTarget, setDecisionTarget] = useState<DecisionTarget | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [saving, setSaving] = useState(false);
  const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null);
  const [detail, setDetail] = useState<DayDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const detailRequestRef = useRef(0);

  const fetchData = useCallback(async (nextFilters: AdminDailyLogFilters) => {
    try {
      const [nextTalents, nextLogs] = await Promise.all([
        adminService.getTalentOptions(),
        adminService.getAdminDailyLogs(nextFilters),
      ]);
      setTalents(nextTalents);
      setLogs(Array.isArray(nextLogs) ? nextLogs : []);
    } catch (error) {
      setPageError(getErrorMessage(error, LOAD_ERROR));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    let active = true;

    Promise.all([
      adminService.getTalentOptions(),
      adminService.getAdminDailyLogs(appliedFilters),
    ])
      .then(([nextTalents, nextLogs]) => {
        if (!active) return;
        setTalents(nextTalents);
        setLogs(Array.isArray(nextLogs) ? nextLogs : []);
      })
      .catch((error: unknown) => {
        if (active) setPageError(getErrorMessage(error, LOAD_ERROR));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, isAdmin, appliedFilters]);

  const talentNamesById = useMemo(
    () => new Map(talents.map((talent) => [talent.id, talent.full_name])),
    [talents],
  );

  const handleApplyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setPageError("");
    setNotice("");
    setAppliedFilters({
      date: filters.date.trim() || undefined,
      userId: filters.userId.trim() || undefined,
      status: filters.status || undefined,
    });
  };

  const handleResetFilters = () => {
    setLoading(true);
    setPageError("");
    setNotice("");
    setFilters(EMPTY_FILTERS);
    setAppliedFilters({});
  };

  const openDecision = (log: AdminDailyLogDto, action: AdminDailyLogDecision) => {
    if (typeof log.id !== "number") return;
    setNotice("");
    setPageError("");
    setReason("");
    setReasonError("");
    setDecisionTarget({
      id: log.id,
      talentName: log.fullName || "Talent",
      logDate: formatDate(log.logDate),
      action,
    });
  };

  const handleConfirmDecision = async () => {
    const target = decisionTarget;
    if (!target || saving) return;

    const needsReason = target.action === "reject";
    if (needsReason) {
      const validationMessage = validateRejectionReason(reason);
      if (validationMessage) {
        setReasonError(validationMessage);
        return;
      }
    }

    setSaving(true);
    setPageError("");
    try {
      await adminService.decideDailyLog(
        target.id,
        target.action,
        needsReason ? reason.trim() : undefined,
      );
      setDecisionTarget(null);
      setReason("");
      setReasonError("");
      setNotice(DECISION_NOTICES[target.action]);
      setLoading(true);
      await fetchData(appliedFilters);
    } catch (error) {
      setPageError(getErrorMessage(error, DECISION_ERROR));
    } finally {
      setSaving(false);
    }
  };

  const closeDetail = () => {
    detailRequestRef.current += 1;
    setDetailTarget(null);
    setDetail(null);
    setDetailError("");
    setDetailLoading(false);
  };

  const openDetail = async (log: AdminDailyLogDto) => {
    if (typeof log.userId !== "number" || !log.logDate) return;

    const dateIso = log.logDate.slice(0, 10);
    const requestId = detailRequestRef.current + 1;
    detailRequestRef.current = requestId;
    setDetailTarget({
      userId: log.userId,
      fullName: log.fullName || "Talent",
      dateIso,
      dateLabel: formatDate(dateIso),
      statusCode: log.status ?? "",
      statusLabel: statusLabel(log.status),
      submittedAt: log.submittedAt ?? null,
      rejectionReason: log.rejectionReason ?? null,
      revisionReason: log.revisionReason ?? null,
    });
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const day = await adminService.getTalentDailyLog(log.userId, dateIso);
      if (detailRequestRef.current === requestId) setDetail(day);
    } catch (error) {
      if (detailRequestRef.current === requestId) {
        setDetailError(getErrorMessage(error, DETAIL_ERROR));
      }
    } finally {
      if (detailRequestRef.current === requestId) setDetailLoading(false);
    }
  };

  if (authLoading) {
    return <LoadingState label="Memeriksa akses admin..." />;
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center px-5 py-12">
        <div
          role="alert"
          className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900"
        >
          Halaman ini hanya dapat diakses oleh Admin.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-surface px-6 py-8 text-ink">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brand">ADMIN</p>
          <h1 className="text-2xl font-bold">Persetujuan Daily Log</h1>
          <p className="mt-1 text-sm text-slate-500">
            Telusuri dan putuskan Daily Log seluruh talent.
          </p>
        </div>
        {loading ? (
          <span className="inline-flex items-center gap-2 text-sm text-slate-500">
            <LoaderCircle size={16} className="animate-spin text-brand" />
            Memuat data...
          </span>
        ) : null}
      </header>

      {pageError ? (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <span>{pageError}</span>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setPageError("");
              void fetchData(appliedFilters);
            }}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            Coba lagi
          </button>
        </div>
      ) : null}

      {notice ? (
        <div
          role="status"
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {notice}
        </div>
      ) : null}

      <form
        onSubmit={handleApplyFilters}
        className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4"
      >
        <FilterField label="Tanggal" htmlFor="admin-log-date">
          <input
            id="admin-log-date"
            type="date"
            value={filters.date}
            onChange={(event) =>
              setFilters((current) => ({ ...current, date: event.target.value }))
            }
            className={fieldClass}
            disabled={loading}
          />
        </FilterField>

        <FilterField label="Talent" htmlFor="admin-log-user">
          <select
            id="admin-log-user"
            value={filters.userId}
            onChange={(event) =>
              setFilters((current) => ({ ...current, userId: event.target.value }))
            }
            className={fieldClass}
            disabled={loading}
          >
            <option value="">Semua talent</option>
            {talents.map((talent) => (
              <option key={talent.id} value={talent.id}>
                {talent.full_name}
              </option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Status" htmlFor="admin-log-status">
          <select
            id="admin-log-status"
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({ ...current, status: event.target.value }))
            }
            className={fieldClass}
            disabled={loading}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FilterField>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search size={16} />
            Terapkan
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            disabled={loading}
            className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Atur ulang
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Tanggal</th>
                <th scope="col" className="px-5 py-3 font-semibold">Talent</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                <th scope="col" className="px-5 py-3 font-semibold">Durasi</th>
                <th scope="col" className="px-5 py-3 font-semibold">Task</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => {
                const status = log.status ?? "";
                const actionLabel = `${log.fullName || "Talent"} ${formatDate(log.logDate)}`;
                return (
                  <tr key={log.id ?? `${log.userId}-${log.logDate}`} className="hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                      {formatDate(log.logDate)}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink">
                        {log.fullName || talentNamesById.get(log.userId ?? -1) || "—"}
                      </p>
                      {log.email ? (
                        <p className="text-xs text-slate-500">{log.email}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}
                      >
                        {statusLabel(status)}
                      </span>
                      {log.rejectionReason ? (
                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500" title={log.rejectionReason}>
                          Alasan: {log.rejectionReason}
                        </p>
                      ) : null}
                      {log.revisionReason ? (
                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500" title={log.revisionReason}>
                          Revisi: {log.revisionReason}
                        </p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                      {formatDuration(log.totalDurationMinutes)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{log.taskCount ?? 0}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void openDetail(log)}
                          aria-label={`Lihat Daily Log ${actionLabel}`}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          <Eye size={14} /> Lihat
                        </button>
                        {status === "MENUNGGU" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openDecision(log, "approve")}
                              aria-label={`Setujui Daily Log ${actionLabel}`}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                            >
                              <CheckCircle2 size={14} /> Setujui
                            </button>
                            <button
                              type="button"
                              onClick={() => openDecision(log, "reject")}
                              aria-label={`Tolak Daily Log ${actionLabel}`}
                              className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              Tolak
                            </button>
                          </>
                        ) : null}
                        {status === "PERBAIKAN_DIAJUKAN" ? (
                          <button
                            type="button"
                            onClick={() => openDecision(log, "approve-revision")}
                            aria-label={`Setujui revisi Daily Log ${actionLabel}`}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                          >
                            <RotateCcw size={14} /> Setujui revisi
                          </button>
                        ) : null}
                        {status !== "MENUNGGU" && status !== "PERBAIKAN_DIAJUKAN" ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">
                    Tidak ada Daily Log yang cocok dengan filter.
                  </td>
                </tr>
              ) : null}
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">
                    Memuat daftar Daily Log...
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog
        open={decisionTarget !== null}
        title={decisionTarget ? DECISION_TITLES[decisionTarget.action] : ""}
        confirmLabel={
          saving
            ? "Menyimpan..."
            : decisionTarget
              ? DECISION_CONFIRMS[decisionTarget.action]
              : "Simpan"
        }
        cancelLabel="Batal"
        tone={decisionTarget?.action === "reject" ? "danger" : "default"}
        onCancel={() => setDecisionTarget(null)}
        onConfirm={() => void handleConfirmDecision()}
      >
        {decisionTarget ? (
          <div className="space-y-4">
            <p>
              Daily Log <strong>{decisionTarget.talentName}</strong> (
              {decisionTarget.logDate}) akan
              {decisionTarget.action === "approve"
                ? " disetujui."
                : decisionTarget.action === "reject"
                  ? " ditolak."
                  : " revisinya disetujui."}
            </p>

            {decisionTarget.action === "reject" ? (
              <label htmlFor="admin-decision-reason" className="block space-y-1.5">
                <span className="block text-xs font-semibold text-slate-700">
                  Alasan penolakan (wajib)
                </span>
                <textarea
                  id="admin-decision-reason"
                  rows={4}
                  maxLength={REJECTION_REASON_MAX}
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    setReasonError("");
                  }}
                  aria-invalid={reasonError ? true : undefined}
                  className={fieldClass}
                />
                <span className="block text-xs text-slate-500">
                  Maksimal {REJECTION_REASON_MAX} karakter.
                </span>
                {reasonError ? (
                  <span role="alert" className="block text-xs font-medium text-red-700">
                    {reasonError}
                  </span>
                ) : null}
              </label>
            ) : null}
          </div>
        ) : null}
      </Dialog>

      <AdminDailyLogDetail
        open={detailTarget !== null}
        fullName={detailTarget?.fullName ?? ""}
        dateIso={detailTarget?.dateIso ?? ""}
        dateLabel={detailTarget?.dateLabel ?? ""}
        statusCode={detailTarget?.statusCode ?? ""}
        statusLabel={detailTarget?.statusLabel ?? ""}
        submittedAt={detailTarget?.submittedAt ?? null}
        rejectionReason={detailTarget?.rejectionReason ?? null}
        revisionReason={detailTarget?.revisionReason ?? null}
        day={detail}
        loading={detailLoading}
        errorMessage={detailError}
        onClose={closeDetail}
      />
    </main>
  );
}

function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block space-y-1.5">
      <span className="block text-xs font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <main className="flex min-h-[50vh] items-center justify-center gap-2 px-5 text-sm text-slate-500">
      <LoaderCircle size={18} className="animate-spin text-brand" />
      {label}
    </main>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  return fallback;
}

function statusLabel(value: string | null | undefined): string {
  const mapped = statusFromCode(value);
  if (mapped) return mapped;
  if (!value) return "—";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusBadgeClass(status: string | null | undefined): string {
  switch (status) {
    case "MENUNGGU":
      return "bg-amber-50 text-amber-700";
    case "DISETUJUI":
      return "bg-emerald-50 text-emerald-700";
    case "DITOLAK":
      return "bg-red-50 text-red-700";
    case "PERBAIKAN_DIAJUKAN":
      return "bg-purple-50 text-purple-700";
    case "DRAF_DIBUKA_KEMBALI":
      return "bg-blue-50 text-blue-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatDate(value: string | null | undefined): string {
  const isoDate = value?.slice(0, 10);
  if (!isoDate) return "—";
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDuration(value: number | null | undefined): string {
  const total =
    typeof value === "number" && Number.isFinite(value)
      ? Math.max(0, Math.round(value))
      : 0;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return hours > 0 ? `${hours}j ${minutes}m` : `${minutes} menit`;
}
