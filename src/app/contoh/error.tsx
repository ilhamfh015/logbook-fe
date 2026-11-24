"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logger } from "@/lib/logger";

export default function ExampleError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    logger.error("Halaman Contoh Log Book gagal ditampilkan", error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-5 py-8 text-ink">
      <section className="w-full max-w-lg rounded-xl border border-red-200 bg-white p-6 shadow-sm" role="alert">
        <h1 className="text-xl font-bold">Contoh Log Book tidak dapat ditampilkan</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Terjadi kesalahan saat membuka halaman contoh. Coba muat ulang. 
        </p>
        {error.digest ? <p className="mt-2 text-xs text-slate-500">Kode galat: {error.digest}</p> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => retry()}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Coba lagi
          </button>
          <Link href="/" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Kembali ke Daily Log
          </Link>
        </div>
      </section>
    </main>
  );
}
