"use client";

import type { AdminImportTemporaryPassword } from "@/services/adminService";

type ImportResultProps = {
  created: number;
  updated: number;
  tempPasswords: AdminImportTemporaryPassword[];
  onFinish: () => void;
};

export function ImportResult({
  created,
  updated,
  tempPasswords,
  onFinish,
}: ImportResultProps) {
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

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Kata sandi sementara</h2>

        <p className="mt-3 text-sm text-slate-500">
          Kata sandi hanya ditampilkan selama hasil impor ini terbuka. Klik
          Selesai untuk menghapusnya dari halaman. Talent wajib menggantinya
          saat login pertama.
        </p>

        {tempPasswords.length > 0 ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="p-3">Email</th>
                  <th className="p-3">Kata sandi sementara</th>
                </tr>
              </thead>

              <tbody>
                {tempPasswords.map((item, index) => (
                  <tr
                    key={`${item.email}-${index}`}
                    className="border-b last:border-0"
                  >
                    <td className="p-3">{item.email}</td>
                    <td className="p-3 font-mono font-semibold">
                      {item.password}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            Tidak ada kata sandi sementara yang perlu ditampilkan.
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
