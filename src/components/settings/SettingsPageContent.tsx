"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Clock3, Info, LoaderCircle, Save } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { toMinutes } from "@/lib/taskTime";
import { ApiError } from "@/services/apiClient";
import { settingsService, type UserSettingsApi } from "@/services/settingsService";

const fieldClass = "field-control min-h-10 disabled:cursor-not-allowed disabled:bg-slate-50";
const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function SettingsPageContent() {
  const { loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [workStart, setWorkStart] = useState("08:00");
  const [workEnd, setWorkEnd] = useState("17:00");
  const [onboarded, setOnboarded] = useState(false);
  const [activeDate, setActiveDate] = useState<string | null>(null);

  const applySettings = useCallback((settings: UserSettingsApi) => {
    setWorkStart(settings.workStart);
    setWorkEnd(settings.workEnd);
    setOnboarded(settings.onboarded);
    setActiveDate(settings.activeDate);
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setPageError("");
    setNotice("");
    try {
      applySettings(await settingsService.getSettings());
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [applySettings]);

  useEffect(() => {
    if (authLoading) return;
    let active = true;

    void settingsService.getSettings()
      .then((settings) => {
        if (!active) return;
        applySettings(settings);
        setPageError("");
        setNotice("");
      })
      .catch((error: unknown) => {
        if (active) setPageError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [authLoading, applySettings]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    if (!timePattern.test(workStart) || !timePattern.test(workEnd)) {
      setPageError("Jam kerja harus menggunakan format HH:mm yang valid.");
      return;
    }

    setPageError("");
    setSaving(true);
    try {
      const updated = await settingsService.updateSettings({ workStart, workEnd, onboarded });
      applySettings(updated);
      setNotice("Pengaturan berhasil disimpan.");
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return <LoadingState label="Memeriksa akses..." />;
  }

  const nightShift = timePattern.test(workStart) && timePattern.test(workEnd)
    && toMinutes(workEnd) <= toMinutes(workStart);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-5 py-7 pb-28 lg:px-8 lg:pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-brand">
            <Clock3 size={21} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Pengaturan</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Atur jam kerja harian dan status panduan Log Book. Jam selesai boleh lebih awal
              dari jam mulai untuk shift malam.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadSettings()}
          disabled={loading || saving}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? <LoaderCircle size={16} className="animate-spin" /> : <Clock3 size={16} />}
          Muat ulang
        </button>
      </header>

      {pageError ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{pageError}</span>
          <button type="button" onClick={() => void loadSettings()} className="font-semibold underline">
            Coba lagi
          </button>
        </div>
      ) : null}
      {notice ? (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {notice}
        </p>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-ink">Jam kerja</h2>
            <p className="mt-1 text-xs text-slate-500">
              Format HH:mm. Batas hari Daily Log mengikuti jam kerja yang tersimpan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 p-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Jam mulai" htmlFor="settings-work-start">
                <input
                  id="settings-work-start"
                  type="time"
                  required
                  value={workStart}
                  onChange={(event) => setWorkStart(event.target.value)}
                  disabled={loading || saving}
                  className={fieldClass}
                />
              </Field>
              <Field label="Jam selesai" htmlFor="settings-work-end">
                <input
                  id="settings-work-end"
                  type="time"
                  required
                  value={workEnd}
                  onChange={(event) => setWorkEnd(event.target.value)}
                  disabled={loading || saving}
                  className={fieldClass}
                />
              </Field>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <input
                type="checkbox"
                checked={onboarded}
                onChange={(event) => setOnboarded(event.target.checked)}
                disabled={loading || saving}
                className="mt-1 h-4 w-4 accent-brand"
              />
              <span className="space-y-1">
                <span className="block text-sm font-semibold text-ink">Panduan awal sudah dilihat</span>
                <span className="block text-xs leading-5 text-slate-500">
                  Status ini menyimpan apakah pengenalan Log Book sudah ditampilkan.
                </span>
              </span>
            </label>

            {nightShift ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Shift malam terdeteksi. Jam selesai pada hari berikutnya dipakai sebagai batas hari.
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">
                {loading ? "Memuat pengaturan..." : "Perubahan disimpan untuk akun Anda."}
              </p>
              <button type="submit" disabled={loading || saving} className={primaryButtonClass}>
                {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Menyimpan..." : "Simpan pengaturan"}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-brand">
            <Info size={18} />
            <h2 className="font-bold text-ink">Ringkasan</h2>
          </div>
          <SummaryRow label="Jam kerja" value={`${workStart} – ${workEnd}`} />
          <SummaryRow
            label="Hari aktif server"
            value={loading ? "Memuat..." : formatActiveDate(activeDate)}
          />
          <SummaryRow
            label="Status panduan"
            value={onboarded ? "Sudah dilihat" : "Belum dilihat"}
          />
          <p className="text-xs leading-5 text-slate-500">
            Hari aktif dihitung server berdasarkan zona waktu Asia/Jakarta. Pada shift malam,
            tanggalnya tetap tanggal mulai shift sampai jam kerja berakhir.
          </p>
        </section>
      </div>
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
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

function formatActiveDate(value: string | null): string {
  if (!value) return "Tidak tersedia";
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Tidak tersedia";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Pengaturan belum dapat dimuat. Periksa koneksi lalu coba lagi.";
}
