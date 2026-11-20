"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError } from "@/services/apiClient";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;

function errorMessage(caught: unknown): string {
  if (!(caught instanceof ApiError)) {
    return "Tidak dapat terhubung ke server. Pastikan backend berjalan.";
  }

  const fieldMessage = caught.field ? caught.fieldErrors[caught.field] : undefined;
  const firstFieldMessage = Object.values(caught.fieldErrors)[0];
  return fieldMessage ?? firstFieldMessage ?? caught.message;
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, loading, changePassword, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentPassword) {
      setError("Kata sandi saat ini wajib diisi.");
      return;
    }

    if (!newPassword) {
      setError("Kata sandi baru wajib diisi.");
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError("Kata sandi baru minimal 8 karakter.");
      return;
    }

    if (newPassword.length > MAX_PASSWORD_LENGTH) {
      setError("Kata sandi baru maksimal 72 karakter.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("Kata sandi baru harus berbeda dari kata sandi saat ini.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await changePassword(currentPassword, newPassword);
      router.replace("/");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface text-ink">
        <Loader2 size={24} className="animate-spin text-brand" aria-label="Memuat" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10 text-ink">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-brand">
            <KeyRound size={24} />
          </span>

          <div>
            <p className="text-2xl font-extrabold tracking-tight text-slate-950">HRMS</p>
            <p className="text-sm text-slate-500">Log Book</p>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-bold tracking-tight">Ganti kata sandi</h1>

          <p className="mt-1 text-sm text-slate-600">
            {user.mustChangePassword
              ? "Kata sandi harus diganti sebelum melanjutkan ke halaman lain."
              : "Perbarui kata sandi akun Anda."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Kata sandi saat ini</span>

              <input
                type="password"
                name="currentPassword"
                autoComplete="current-password"
                autoFocus
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="field-control"
                placeholder="Masukkan kata sandi saat ini"
                disabled={submitting}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Kata sandi baru</span>

              <input
                type="password"
                name="newPassword"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="field-control"
                placeholder="Minimal 8 karakter"
                disabled={submitting}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Ulangi kata sandi baru</span>

              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="field-control"
                placeholder="Masukkan kembali kata sandi baru"
                disabled={submitting}
                required
              />
            </label>

            {error ? (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {submitting ? "Menyimpan..." : "Simpan kata sandi"}
            </button>

            <button
              type="button"
              onClick={logout}
              disabled={submitting}
              className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-70"
            >
              Keluar
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
