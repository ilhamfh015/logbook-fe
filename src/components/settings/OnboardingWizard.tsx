"use client";

import { useState } from "react";
import { Clock3, ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { settingsService } from "@/services/settingsService";
import { ApiError } from "@/services/apiClient";

type Props = {
  onComplete?: () => void;
};

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function OnboardingWizard({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [workStart, setWorkStart] = useState("08:00");
  const [workEnd, setWorkEnd] = useState("17:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => {
    setError("");

    if (step === 2) {
      if (!timePattern.test(workStart) || !timePattern.test(workEnd)) {
        setError("Masukkan jam kerja yang valid.");
        return;
      }
    }

    setStep((current) => Math.min(current + 1, 3));
  };

  const handleBack = () => {
    setError("");
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleFinish = async () => {
    setSaving(true);
    setError("");

    try {
      await settingsService.updateSettings({
        workStart,
        workEnd,
        onboarded: true,
      });

      onComplete?.();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Pengaturan belum berhasil disimpan. Silakan coba lagi.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand">
            <Clock3 size={20} />
            <span className="text-sm font-semibold">Panduan Log Book</span>
          </div>

          <span className="text-xs text-slate-500">Langkah {step} dari 3</span>
        </div>

        <div className="mb-6 flex gap-2">
          {[1, 2, 3].map((number) => (
            <div
              key={number}
              className={`h-1.5 flex-1 rounded-full ${
                number <= step ? "bg-brand" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-ink">
              Selamat datang di Log Book!
            </h2>

            <p className="text-sm leading-6 text-slate-600">
              Log Book membantu Anda mencatat pekerjaan harian, mengelola task,
              dan memantau aktivitas kerja.
            </p>

            <p className="text-sm leading-6 text-slate-600">
              Sebelum mulai, mari atur jam kerja Anda agar sistem dapat
              menyesuaikan pencatatan aktivitas harian.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-ink">Atur jam kerja</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Tentukan waktu mulai dan selesai kerja Anda. Pengaturan ini
                digunakan sebagai acuan hari aktif Log Book.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">
                  Jam mulai
                </span>
                <input
                  type="time"
                  value={workStart}
                  onChange={(event) => setWorkStart(event.target.value)}
                  disabled={saving}
                  className="field-control min-h-10 w-full"
                />
              </label>

              <label className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">
                  Jam selesai
                </span>
                <input
                  type="time"
                  value={workEnd}
                  onChange={(event) => setWorkEnd(event.target.value)}
                  disabled={saving}
                  className="field-control min-h-10 w-full"
                />
              </label>
            </div>

            {timePattern.test(workStart) &&
              timePattern.test(workEnd) &&
              workEnd <= workStart && (
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  Shift malam terdeteksi. Jam selesai dianggap berada pada hari
                  berikutnya.
                </p>
              )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-ink">
              Pengaturan Anda sudah siap
            </h2>

            <p className="text-sm leading-6 text-slate-600">
              Berikut pengaturan jam kerja yang akan digunakan:
            </p>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Jam kerja</p>
              <p className="mt-1 text-lg font-semibold text-ink">
                {workStart} – {workEnd}
              </p>
            </div>

            <p className="text-sm leading-6 text-slate-600">
              Tekan Selesai untuk menyimpan pengaturan dan menyelesaikan panduan
              awal.
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <ArrowLeft size={16} />
              Kembali
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Lanjut
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleFinish()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : null}
              {saving ? "Menyimpan..." : "Selesai"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
