"use client";

import type { AdminImportRowResult } from "@/services/adminService";

type ImportResultProps = {
  created: number;
  updated: number;
  importedEmails?: string[];
  rows?: AdminImportRowResult[];
  onFinish: () => void;
};

export function ImportResult({
  created,
  updated,
  importedEmails = [],
  rows = [],
  onFinish,
}: ImportResultProps) {
  const statusLabel = (status: AdminImportRowResult["status"]) => {
    switch (status) {
      case "created":
        return "Berhasil dibuat";
      case "updated":
        return "Berhasil diperbarui";
      case "failed":
        return "Gagal";
    }
  };

  const statusClass = (status: AdminImportRowResult["status"]) => {
    switch (status) {
      case "created":
        return "bg-green-100 text-green-700";
      case "updated":
        return "bg-blue-100 text-blue-700";
      case "failed":
        return "bg-red-100 text-red-700";
    }
  };

  return (
    <div className="mt-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pengguna baru</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{created}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Diperbarui</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{updated}</p>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Hasil validasi per baris</h2>

          <div className="mt-4 space-y-3">
            {rows.map((row, index) => (
              <div
                key={`${row.rowNumber}-${row.email}-${index}`}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Baris {row.rowNumber}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {row.email || "-"}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass(row.status)}`}
                  >
                    {statusLabel(row.status)}
                  </span>
                </div>

                {row.message && (
                  <p className="mt-3 text-sm text-slate-500">{row.message}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Email pengguna hasil impor</h2>

        <p className="mt-3 text-sm text-slate-500">
          Kata sandi sementara berasal dari kolom password pada CSV dan tidak
          dikirimkan ulang oleh API. Bagikan kata sandi tersebut kepada pengguna
          melalui saluran yang aman; mereka wajib menggantinya saat login
          pertama.
        </p>

        {importedEmails.length > 0 ? (
          <ul className="mt-4 space-y-2" role="list">
            {importedEmails.map((email, index) => (
              <li
                key={`${email}-${index}`}
                className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700"
              >
                {email}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            Tidak ada email pengguna baru yang perlu ditampilkan.
          </p>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onFinish}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Selesai
        </button>
      </div>
    </div>
  );
}
