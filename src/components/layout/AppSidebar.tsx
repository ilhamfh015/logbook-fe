import { BookOpen, FileText, History, Settings } from "lucide-react";
import Link from "next/link";

type AppSidebarProps = { activeItem?: "logbook" | "jejak" | "panduan" | "pengaturan" };

export function AppSidebar({ activeItem = "logbook" }: AppSidebarProps) {
  return (
    <>
    <aside className="relative hidden w-52 shrink-0 border-r border-slate-200 bg-white md:block" aria-label="Navigasi utama">
      <div className="sticky top-0 p-5">
        <p className="px-2 text-2xl font-extrabold tracking-tight text-slate-950">HRMS</p>
        <nav className="mt-8 space-y-1 text-sm">
          <Link href="/" aria-current={activeItem === "logbook" ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 font-semibold ${activeItem === "logbook" ? "bg-blue-100 text-brand" : "text-slate-600 hover:bg-slate-50"}`}><FileText size={19} strokeWidth={2.2} />Log Book</Link>
          <Link href="/jejak" aria-current={activeItem === "jejak" ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 ${activeItem === "jejak" ? "bg-blue-100 font-semibold text-brand" : "text-slate-600 hover:bg-slate-50"}`}><History size={19} />Jejak</Link>
          <div className="my-6 border-t border-slate-200" />
          <p className="px-3 pb-2 text-xs font-semibold text-slate-400">Lainnya</p>
          <Link href="/contoh" aria-current={activeItem === "panduan" ? "page" : undefined} className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-600 hover:bg-slate-50"><BookOpen size={19} />Panduan</Link>
          <Link href="/pengaturan" aria-current={activeItem === "pengaturan" ? "page" : undefined} className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-600 hover:bg-slate-50"><Settings size={19} />Pengaturan</Link>
        </nav>
      </div>
    </aside>
    <nav className="fixed inset-x-3 bottom-3 z-10 grid grid-cols-4 rounded-2xl border border-slate-200 bg-white/95 p-1.5 text-[11px] font-medium shadow-lg backdrop-blur md:hidden" aria-label="Navigasi utama">
      <Link href="/" aria-current={activeItem === "logbook" ? "page" : undefined} className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 ${activeItem === "logbook" ? "bg-blue-50 text-brand" : "text-slate-600"}`}><FileText size={18} />Log Book</Link>
      <Link href="/jejak" aria-current={activeItem === "jejak" ? "page" : undefined} className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 ${activeItem === "jejak" ? "bg-blue-50 text-brand" : "text-slate-600"}`}><History size={18} />Jejak</Link>
      <Link href="/contoh" className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-slate-600"><BookOpen size={18} />Panduan</Link>
      <Link href="/pengaturan" className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-slate-600"><Settings size={18} />Pengaturan</Link>
    </nav>
    </>
  );
}
