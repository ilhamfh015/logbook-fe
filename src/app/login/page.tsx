"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError } from "@/services/apiClient";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Email wajib diisi.");
      return;
    }

    if (!password) {
      setError("Kata sandi wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await login(cleanEmail, password);
      router.replace("/");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Tidak dapat terhubung ke server. Pastikan backend berjalan.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10 text-ink">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-brand">
            <FileText size={24} />
          </span>

          <div>
            <p className="text-2xl font-extrabold tracking-tight text-slate-950">
              HRMS
            </p>
            <p className="text-sm text-slate-500">Log Book</p>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-xl font-bold tracking-tight">Masuk</h1>

          <p className="mt-1 text-sm text-slate-600">
            Gunakan email dan kata sandi yang terdaftar untuk mengakses log book.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Email</span>

              <input
                type="email"
                name="email"
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="field-control"
                placeholder="nama@contoh.id"
                disabled={submitting}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Kata sandi</span>

              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="field-control"
                placeholder="Masukkan kata sandi"
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
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}

              {submitting ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
