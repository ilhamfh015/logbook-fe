"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Users,
  Clock3,
  AlertCircle,
  CalendarOff,
  ArrowUpRight,
} from "lucide-react";
import { ErrorNotice } from "@/components/shared/ErrorNotice";
import { itemsFromApiError } from "@/lib/errorItems";
import { mapTeamMember, type TeamMemberRow, type TeamMemberStatus } from "@/lib/teamMapper";
import { getTeam } from "@/services/teamService";

const formatDate = (dateKey: string) =>
  new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateKey}T12:00:00+07:00`));

function dateKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TeamDashboard() {
  const [retryCount, setRetryCount] = useState(0);
  const [requestResult, setRequestResult] = useState<{
    key: number;
    members: TeamMemberRow[];
    errorItems: ReturnType<typeof itemsFromApiError>;
  }>({ key: -1, members: [], errorItems: [] });
  const requestKey = retryCount;

  useEffect(() => {
    let active = true;

    getTeam()
      .then((result) => {
        if (active) {
          setRequestResult({
            key: requestKey,
            members: result.map(mapTeamMember),
            errorItems: [],
          });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setRequestResult({ key: requestKey, members: [], errorItems: itemsFromApiError(error) });
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [requestKey]);

  const loading = requestResult.key !== requestKey;
  const members = loading ? [] : requestResult.members;
  const errorItems = loading ? [] : requestResult.errorItems;
  const hasError = errorItems.length > 0;
  const summaryReady = !loading && !hasError;
  const todayDate = members.find((member) => member.date)?.date ?? dateKeyFromDate(new Date());
  const pendingDays = members.reduce((total, member) => total + member.pendingDays, 0);
  const revisionCount = members.filter((member) => member.status === "Perbaikan diajukan").length;
  const leaveCount = members.filter((member) => member.status === "Cuti" || member.status === "Libur").length;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-5 py-7 lg:px-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="text-brand" size={23} />
            <h1 className="text-2xl font-bold tracking-tight text-ink">Tim</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Anggota tim yang menjadikan Anda atasan langsung
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5">
          <button
            type="button"
            disabled
            title="Daftar tim saat ini hanya untuk hari ini."
            aria-label="Hari sebelumnya"
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex min-w-44 items-center justify-center gap-2 text-sm font-semibold text-slate-700">
            <CalendarDays size={17} className="text-brand" />
            {formatDate(todayDate)}
          </div>

          <button
            type="button"
            disabled
            title="Daftar tim saat ini hanya untuk hari ini."
            aria-label="Hari berikutnya"
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Anggota tim"
          value={summaryReady ? String(members.length) : "—"}
          description="Bawahan langsung"
          icon={<Users size={20} />}
        />
        <SummaryCard
          title="Menunggu keputusan"
          value={summaryReady ? `${pendingDays} hari` : "—"}
          description="Daily Log menunggu"
          icon={<Clock3 size={20} />}
        />
        <SummaryCard
          title="Perbaikan diajukan"
          value={summaryReady ? String(revisionCount) : "—"}
          description="Menunggu pemeriksaan"
          icon={<AlertCircle size={20} />}
        />
        <SummaryCard
          title="Cuti atau libur hari ini"
          value={summaryReady ? (leaveCount > 0 ? String(leaveCount) : "-") : "—"}
          description="Anggota tidak bekerja"
          icon={<CalendarOff size={20} />}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-ink">Ringkasan anggota tim</h2>
          <p className="mt-1 text-xs text-slate-500">
            Status aktivitas anggota hari ini
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Anggota</th>
                <th className="px-5 py-4 font-semibold">Status hari ini</th>
                <th className="px-5 py-4 font-semibold">Jam hari ini</th>
                <th className="px-5 py-4 font-semibold">
                  Hari menunggu keputusan
                </th>
                <th className="px-5 py-4 text-right font-semibold">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500" role="status">
                    Memuat daftar tim...
                  </td>
                </tr>
              ) : hasError ? (
                <tr>
                  <td colSpan={5} className="px-5 py-5">
                    <div className="space-y-3">
                      <ErrorNotice items={errorItems} variant="banner" />
                      <button
                        type="button"
                        onClick={() => setRetryCount((count) => count + 1)}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      >
                        Coba lagi
                      </button>
                    </div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">
                    Belum ada anggota tim.
                  </td>
                </tr>
              ) : members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-brand">
                        {member.initial}
                      </div>
                      <div>
                        <p className="font-semibold text-ink">{member.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {member.jenis}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={member.status} />
                  </td>

                  <td className="px-5 py-4 font-medium text-slate-700">
                    {member.hours}
                  </td>

                  <td className="px-5 py-4">
                    {member.pending.length > 0 ? (
                      <div className="space-y-1">
                        {member.pending.map((item) => item.date ? (
                          <Link
                            key={`${member.id}-${item.date}`}
                            href={`/tim/${member.id}/${item.date}`}
                            className="block text-xs text-slate-600"
                          >
                            {item.text}
                          </Link>
                        ) : (
                          <p key={`${member.id}-${item.text}`} className="text-xs text-slate-600">
                            {item.text}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Tidak ada</span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/tim/${member.id}/${member.date ?? todayDate}`}
                      aria-label={`Buka Daily Log ${member.name}`}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-ink hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      Buka <ArrowUpRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-500">
            Klik hari menunggu untuk membuka Daily Log hanya baca. Jam = total
            harian, aktivitas paralel dihitung sekali.
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Menampilkan status hari ini. Daftar lengkap hari menunggu keputusan akan ditampilkan setelah tersedia dari server.
          </p>
        </div>
      </section>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-ink">
            {value}
          </p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3 text-brand">{icon}</div>
      </div>
      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </article>
  );
}

function StatusBadge({ status }: { status: TeamMemberStatus }) {
  const styles: Record<TeamMemberStatus, string> = {
    Draf: "bg-slate-100 text-slate-700",
    "Belum mulai": "bg-amber-50 text-amber-700",
    Cuti: "bg-purple-50 text-purple-700",
    Menunggu: "bg-amber-50 text-amber-700",
    Disetujui: "bg-slate-100 text-slate-700",
    Ditolak: "bg-red-50 text-red-700",
    "Perbaikan diajukan": "bg-amber-50 text-amber-700",
    "Draf dibuka kembali": "bg-slate-100 text-slate-700",
    Libur: "bg-purple-50 text-purple-700",
    "Status tidak diketahui": "bg-slate-100 text-slate-700",
    Terlewat: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}
