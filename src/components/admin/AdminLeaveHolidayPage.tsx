"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CalendarDays,
  CalendarOff,
  LoaderCircle,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Dialog } from "@/components/shared/Dialog";
import { ApiError } from "@/services/apiClient";
import {
  adminService,
  type AdminHoliday,
  type AdminLeave,
  type AdminTalent,
} from "@/services/adminService";

type DeleteTarget =
  | { type: "holiday"; date: string; label: string }
  | { type: "leave"; id: number; label: string };

const fieldClass =
  "field-control min-h-10 disabled:cursor-not-allowed disabled:bg-slate-50";
const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export function AdminLeaveHolidayPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.roles.includes("ADMIN") ?? false;
  const [holidays, setHolidays] = useState<AdminHoliday[]>([]);
  const [talents, setTalents] = useState<AdminTalent[]>([]);
  const [leaves, setLeaves] = useState<AdminLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [leaveUserId, setLeaveUserId] = useState("");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveNote, setLeaveNote] = useState("");
  const [holidaySaving, setHolidaySaving] = useState(false);
  const [leaveSaving, setLeaveSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  const loadData = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const [nextHolidays, nextTalents, nextLeaves] = await fetchAdminData();
      setHolidays(nextHolidays);
      setTalents(nextTalents);
      setLeaves(nextLeaves);
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    let active = true;

    void fetchAdminData()
      .then(([nextHolidays, nextTalents, nextLeaves]) => {
        if (!active) return;
        setHolidays(nextHolidays);
        setTalents(nextTalents);
        setLeaves(nextLeaves);
        setPageError("");
      })
      .catch((error: unknown) => {
        if (active) setPageError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, isAdmin]);

  const holidayYears = useMemo(
    () =>
      [...new Set([new Date().getFullYear(), ...holidays.map((holiday) => yearOf(holiday.holiday_date))])]
        .sort((left, right) => right - left),
    [holidays],
  );
  const visibleHolidays = useMemo(
    () => holidays.filter((holiday) => yearOf(holiday.holiday_date) === selectedYear),
    [holidays, selectedYear],
  );
  const holidayDates = useMemo(
    () => new Set(holidays.map((holiday) => dateOnly(holiday.holiday_date))),
    [holidays],
  );

  const handleAddHoliday = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    setHolidaySaving(true);
    try {
      await adminService.addHoliday(holidayDate, holidayName.trim());
      setHolidayDate("");
      setHolidayName("");
      setNotice("Libur nasional berhasil ditambahkan.");
      await loadData();
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setHolidaySaving(false);
    }
  };

  const handleAddLeave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    if (leaveEnd < leaveStart) {
      setPageError("Tanggal sampai tidak boleh sebelum tanggal dari.");
      return;
    }

    setLeaveSaving(true);
    try {
      await adminService.addLeave(
        Number(leaveUserId),
        leaveStart,
        leaveEnd,
        leaveNote.trim(),
      );
      setLeaveUserId("");
      setLeaveStart("");
      setLeaveEnd("");
      setLeaveNote("");
      setNotice("Cuti talent berhasil ditambahkan.");
      await loadData();
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLeaveSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setPageError("");
    setNotice("");
    try {
      if (deleteTarget.type === "holiday") {
        await adminService.deleteHoliday(deleteTarget.date);
        setNotice("Libur nasional berhasil dihapus.");
      } else {
        await adminService.deleteLeave(deleteTarget.id);
        setNotice("Data cuti berhasil dihapus.");
      }
      setDeleteTarget(null);
      await loadData();
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading) {
    return <LoadingState label="Memeriksa akses admin..." />;
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-12 lg:px-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          Halaman ini hanya dapat diakses oleh Admin.
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-5 py-7 pb-28 lg:px-8 lg:pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-brand">
            <CalendarOff size={21} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Libur dan Cuti</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Hari berlabel tidak menjadi Terlewat dan tidak dihitung sebagai hari kerja,
              tetapi Daily Log tetap boleh diisi.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? <LoaderCircle size={16} className="animate-spin" /> : <CalendarDays size={16} />}
          Muat ulang
        </button>
      </header>

      {pageError ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{pageError}</span>
          <button type="button" onClick={() => void loadData()} className="font-semibold underline">
            Coba lagi
          </button>
        </div>
      ) : null}
      {notice ? (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {notice}
        </p>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-ink">Libur nasional {selectedYear}</h2>
              <p className="mt-1 text-xs text-slate-500">Tanggal libur yang berlaku untuk seluruh talent</p>
            </div>
            <label className="sr-only" htmlFor="holiday-year">Tahun libur nasional</label>
            <select
              id="holiday-year"
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-blue-100"
            >
              {holidayYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Tanggal</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Nama libur</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleHolidays.map((holiday) => (
                  <tr key={holiday.id} className="hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-600">
                      {formatDate(holiday.holiday_date)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-ink">{holiday.name}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({
                          type: "holiday",
                          date: dateOnly(holiday.holiday_date),
                          label: holiday.name,
                        })}
                        aria-label={`Hapus libur ${holiday.name}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && visibleHolidays.length === 0 ? (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-sm text-slate-500">Belum ada libur nasional pada tahun ini.</td></tr>
                ) : null}
                {loading ? (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-sm text-slate-500">Memuat daftar libur...</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleAddHoliday} className="space-y-4 border-t border-slate-100 bg-slate-50/70 p-5">
            <h3 className="text-sm font-bold text-ink">Tambah libur nasional</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tanggal" htmlFor="holiday-date">
                <input
                  id="holiday-date"
                  type="date"
                  required
                  value={holidayDate}
                  onChange={(event) => setHolidayDate(event.target.value)}
                  className={fieldClass}
                />
              </Field>
              <Field label="Nama libur" htmlFor="holiday-name">
                <input
                  id="holiday-name"
                  type="text"
                  required
                  maxLength={120}
                  value={holidayName}
                  onChange={(event) => setHolidayName(event.target.value)}
                  placeholder="Contoh: Hari Kemerdekaan"
                  className={fieldClass}
                />
              </Field>
            </div>
            <button type="submit" disabled={holidaySaving || loading} className={primaryButtonClass}>
              {holidaySaving ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
              Tambah libur
            </button>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-brand" />
              <h2 className="font-bold text-ink">Cuti talent</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">Atur rentang cuti dan keterangan untuk talent</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Talent</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Mulai</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Selesai</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Hari kerja</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Keterangan</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-ink">{leave.full_name}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{formatDate(leave.start_date)}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{formatDate(leave.end_date)}</td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {countWorkDays(leave.start_date, leave.end_date, holidayDates)}
                    </td>
                    <td className="max-w-40 px-4 py-3.5 text-slate-600">{leave.note || "—"}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({
                          type: "leave",
                          id: leave.id,
                          label: `${leave.full_name} (${formatDate(leave.start_date)})`,
                        })}
                        aria-label={`Hapus cuti ${leave.full_name}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} /> Hapus
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && leaves.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Belum ada cuti talent.</td></tr>
                ) : null}
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Memuat daftar cuti...</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleAddLeave} className="space-y-4 border-t border-slate-100 bg-slate-50/70 p-5">
            <h3 className="text-sm font-bold text-ink">Tambah cuti</h3>
            <Field label="Talent" htmlFor="leave-user">
              <select
                id="leave-user"
                required
                value={leaveUserId}
                onChange={(event) => setLeaveUserId(event.target.value)}
                className={fieldClass}
                disabled={loading || talents.length === 0}
              >
                <option value="">Pilih talent</option>
                {talents.map((talent) => (
                  <option key={talent.id} value={talent.id}>{talent.full_name}</option>
                ))}
              </select>
            </Field>
            {talents.length === 0 && !loading ? (
              <p className="text-xs text-amber-700">Belum ada talent aktif yang dapat dipilih.</p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Dari" htmlFor="leave-start">
                <input
                  id="leave-start"
                  type="date"
                  required
                  value={leaveStart}
                  onChange={(event) => {
                    setLeaveStart(event.target.value);
                    if (leaveEnd && event.target.value > leaveEnd) setLeaveEnd("");
                  }}
                  className={fieldClass}
                />
              </Field>
              <Field label="Sampai" htmlFor="leave-end">
                <input
                  id="leave-end"
                  type="date"
                  required
                  min={leaveStart || undefined}
                  value={leaveEnd}
                  onChange={(event) => setLeaveEnd(event.target.value)}
                  className={fieldClass}
                />
              </Field>
            </div>
            <Field label="Keterangan (opsional)" htmlFor="leave-note">
              <input
                id="leave-note"
                type="text"
                maxLength={500}
                value={leaveNote}
                onChange={(event) => setLeaveNote(event.target.value)}
                placeholder="Contoh: Cuti tahunan"
                className={fieldClass}
              />
            </Field>
            <p className="text-xs text-slate-500">Tanggal sampai tidak boleh sebelum tanggal dari.</p>
            <button type="submit" disabled={leaveSaving || loading || talents.length === 0} className={primaryButtonClass}>
              {leaveSaving ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
              Tambah cuti
            </button>
          </form>
        </section>
      </div>

      <Dialog
        open={deleteTarget !== null}
        title={deleteTarget?.type === "holiday" ? "Hapus libur nasional?" : "Hapus data cuti?"}
        confirmLabel={deleting ? "Menghapus..." : "Hapus"}
        cancelLabel="Batal"
        tone="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      >
        {deleteTarget ? (
          <p>Data <strong>{deleteTarget.label}</strong> akan dihapus dan tidak dapat dikembalikan.</p>
        ) : null}
      </Dialog>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
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

function formatDate(value: string): string {
  const date = new Date(`${dateOnly(value)}T12:00:00`);
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function yearOf(value: string): number {
  return Number(dateOnly(value).slice(0, 4));
}

function countWorkDays(start: string, end: string, holidays: Set<string>): number {
  const current = new Date(`${dateOnly(start)}T12:00:00`);
  const endDate = new Date(`${dateOnly(end)}T12:00:00`);
  let count = 0;

  while (current <= endDate) {
    const isoDate = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
    if (current.getDay() !== 0 && current.getDay() !== 6 && !holidays.has(isoDate)) {
      count += 1;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Data libur dan cuti belum dapat dimuat. Periksa koneksi lalu coba lagi.";
}

function fetchAdminData() {
  return Promise.all([
    adminService.getHolidays(),
    adminService.getTalentOptions(),
    adminService.getLeaves(),
  ]);
}
