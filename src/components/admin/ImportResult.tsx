"use client";

type ImportResultProps = {
  created: number;
  updated: number;
  importedEmails?: string[];
  onFinish: () => void;
};

export function ImportResult({
  created,
  updated,
  importedEmails = [],
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
        <h2 className="text-lg font-semibold">Email pengguna hasil impor</h2>

        <p className="mt-3 text-sm text-slate-500">
          Kata sandi sementara berasal dari kolom password pada CSV dan tidak
          dikirimkan ulang oleh API. Bagikan kata sandi tersebut kepada
          pengguna; mereka wajib menggantinya saat login pertama.
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
