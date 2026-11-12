"use client";

import { useState } from "react";
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

type MemberStatus = "Draf" | "Belum mulai" | "Cuti" | "Terlewat";

type TeamMember = {
  id: number;
  name: string;
  initial: string;
  jenis: string;
  status: MemberStatus;
  hours: string;
  pending: string[];
};

const initialMembers: TeamMember[] = [
  {
    id: 1,
    name: "Rina Aulia",
    initial: "R",
    jenis: "PKL",
    status: "Draf",
    hours: "3 j 30 m",
    pending: ["Jum 6 Nov · 8 j", "Sen 9 Nov · 7 j"],
  },
  {
    id: 2,
    name: "Sari Wulandari",
    initial: "S",
    jenis: "Karyawan",
    status: "Draf",
    hours: "2 j",
    pending: ["Sen 9 Nov · 8 j"],
  },
  {
    id: 3,
    name: "Budi Santoso",
    initial: "B",
    jenis: "Magang",
    status: "Belum mulai",
    hours: "0 j",
    pending: ["Kam 5 Nov · 6 j"],
  },
  {
    id: 4,
    name: "Dedi Pratama",
    initial: "D",
    jenis: "Karyawan · shift malam",
    status: "Cuti",
    hours: "—",
    pending: [],
  },
  {
    id: 5,
    name: "Maya Putri",
    initial: "M",
    jenis: "Magang",
    status: "Draf",
    hours: "1 j 30 m",
    pending: ["Perbaikan diajukan", "Jum 6 Nov · 7 j"],
  },
];

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

export function TeamDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 10, 10));

  const changeDate = (amount: number) => {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + amount);
      return next;
    });
  };

  const members = initialMembers;

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
            onClick={() => changeDate(-1)}
            aria-label="Hari sebelumnya"
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex min-w-44 items-center justify-center gap-2 text-sm font-semibold text-slate-700">
            <CalendarDays size={17} className="text-brand" />
            {formatDate(selectedDate)}
          </div>

          <button
            type="button"
            onClick={() => changeDate(1)}
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
          value="5"
          description="Bawahan langsung"
          icon={<Users size={20} />}
        />
        <SummaryCard
          title="Menunggu keputusan"
          value="4 hari"
          description="Daily Log menunggu"
          icon={<Clock3 size={20} />}
        />
        <SummaryCard
          title="Perbaikan diajukan"
          value="1"
          description="Menunggu pemeriksaan"
          icon={<AlertCircle size={20} />}
        />
        <SummaryCard
          title="Cuti atau libur hari ini"
          value="1"
          description="Anggota tidak bekerja"
          icon={<CalendarOff size={20} />}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold text-ink">Ringkasan anggota tim</h2>
          <p className="mt-1 text-xs text-slate-500">
            Status aktivitas anggota berdasarkan tanggal yang dipilih
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
              {members.map((member) => (
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
                        {member.pending.map((item) => (
                          <p key={item} className="text-xs text-slate-600">
                            {item}
                          </p>
                        ))}
                        {member.id === 3 && (
                          <p className="text-xs text-slate-400">
                            Terkirim otomatis
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Tidak ada</span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      disabled
                      title="Detail C4 belum termasuk cakupan pekerjaan ini"
                      className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-400"
                    >
                      Buka <ArrowUpRight size={14} />
                    </button>
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
            Data demonstrasi berdasarkan mockup, belum terhubung ke API.
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

function StatusBadge({ status }: { status: MemberStatus }) {
  const styles: Record<MemberStatus, string> = {
    Draf: "bg-slate-100 text-slate-700",
    "Belum mulai": "bg-amber-50 text-amber-700",
    Cuti: "bg-purple-50 text-purple-700",
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
