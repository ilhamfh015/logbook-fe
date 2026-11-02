"use client";

import { useState } from "react";
import { Bell, ChevronDown, FileText } from "lucide-react";
import Link from "next/link";

export function AppHeader() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200/70 px-5 py-3 lg:px-8">
      <div className="flex items-center gap-2 text-sm text-slate-500"><FileText size={16} /><span aria-hidden="true">›</span><span className="font-medium text-ink">Log Book</span></div>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative">
          <button type="button" onClick={() => { setNotificationsOpen((open) => !open); setProfileOpen(false); }} aria-label="Notifikasi" aria-expanded={notificationsOpen} className="relative rounded-full border border-blue-100 bg-white p-2.5 text-slate-700 shadow-sm hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><Bell size={18} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand" /></button>
          {notificationsOpen ? <div role="status" className="absolute right-0 top-12 z-40 w-64 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-lg"><p className="font-semibold text-ink">Notifikasi</p><p className="mt-2 text-slate-500">Belum ada notifikasi baru.</p></div> : null}
        </div>
        <div className="hidden h-7 w-px bg-slate-200 sm:block" />
        <div className="relative">
          <button type="button" onClick={() => { setProfileOpen((open) => !open); setNotificationsOpen(false); }} aria-label="Menu akun Ilham Farhanul H" aria-expanded={profileOpen} className="flex items-center gap-3 rounded-xl p-1.5 text-left hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-brand">IF</span><span className="hidden text-xs sm:block"><span className="block font-bold text-ink">Ilham Farhanul H</span><span className="text-slate-500">Talent</span></span><ChevronDown size={17} /></button>
          {profileOpen ? <div className="absolute right-0 top-14 z-40 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"><p className="px-3 py-2 text-xs text-slate-500">Masuk sebagai talent</p><Link href="/pengaturan" onClick={() => setProfileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50">Pengaturan akun</Link></div> : null}
        </div>
      </div>
    </header>
  );
}
