"use client";

import { BarChart3, BookOpen, CalendarOff, CheckCircle2, FileText, History, Settings, Users } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { canAccessTeamPage } from "@/lib/rolePermissions";

type AppSidebarProps = {
  activeItem?:
    | "logbook"
    | "jejak"
    | "ringkasan"
    | "panduan"
    | "pengaturan"
    | "tim"
    | "review"
    | "daily-logs"
    | "libur-cuti"
    | "pengguna";
};

// Jumlah kolom navigasi mobile -> kelas Tailwind (harus literal agar terdeteksi).
const MOBILE_GRID_CLASS: Record<number, string> = {
  5: "grid-cols-5",
  6: "grid-cols-6",
  8: "grid-cols-8",
  9: "grid-cols-9",
};

export function AppSidebar({ activeItem = "logbook" }: AppSidebarProps) {
  const { user } = useAuth();
  const isAtasanPage = activeItem === "tim";
  const isTeamActive = activeItem === "tim" || activeItem === "review";
  const canAccessTeam = canAccessTeamPage(user?.roles);
  const isAdmin = user?.roles.includes("ADMIN") ?? false;
  // Halaman Tim: satu tautan Tim selebar 5 kolom. Halaman lain: 5 item dasar
  // (Daily Log, Jejak, Ringkasan, Panduan, Pengaturan) + Tim bila berhak.
  // Admin menambah 3 item (Persetujuan, Libur & Cuti, Pengguna).
  const mobileColumns =
    (isAtasanPage ? 5 : 5 + (canAccessTeam ? 1 : 0)) + (isAdmin ? 3 : 0);
  const mobileGridClass = MOBILE_GRID_CLASS[mobileColumns] ?? "grid-cols-5";

  return (
    <>
      <aside
        className="relative hidden w-52 shrink-0 border-r border-slate-200 bg-white md:block"
        aria-label="Navigasi utama"
      >
        <div className="sticky top-0 flex min-h-screen flex-col p-5">
          <p className="px-2 text-2xl font-extrabold tracking-tight text-slate-950">
            Log Book
          </p>

          <nav className="mt-8 flex-1 space-y-1 text-sm">
            <p className="px-3 pb-2 text-xs font-semibold text-slate-400">
              LOG BOOK SAYA
            </p>

            <Link
              href="/"
              aria-current={activeItem === "logbook" ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
                activeItem === "logbook"
                  ? "bg-blue-100 font-semibold text-brand"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <FileText size={19} />
              Daily Log
            </Link>

            <Link
              href="/jejak"
              aria-current={activeItem === "jejak" ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
                activeItem === "jejak"
                  ? "bg-blue-100 font-semibold text-brand"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <History size={19} />
              Jejak
            </Link>

            <Link
              href="/ringkasan"
              aria-current={activeItem === "ringkasan" ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
                activeItem === "ringkasan"
                  ? "bg-blue-100 font-semibold text-brand"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <BarChart3 size={19} />
              Ringkasanku
            </Link>

            <div className="my-6 border-t border-slate-200" />

            <p className="px-3 pb-2 text-xs font-semibold text-slate-400">
              Lainnya
            </p>

            <Link
              href="/contoh"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-slate-600 hover:bg-slate-50"
            >
              <BookOpen size={19} />
              Contoh Log Book
            </Link>

            <Link
              href="/pengaturan"
              aria-current={activeItem === "pengaturan" ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
                activeItem === "pengaturan"
                  ? "bg-blue-100 font-semibold text-brand"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Settings size={19} />
              Pengaturan
            </Link>

            {canAccessTeam ? (
              <>
                <div className="my-6 border-t border-slate-200" />
                <p className="px-3 pb-2 text-xs font-semibold text-slate-400">
                  ATASAN
                </p>
                <Link
                  href="/atasan/tim"
                  aria-current={isTeamActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
                    isTeamActive
                      ? "bg-blue-100 font-semibold text-brand"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Users size={19} />
                  Tim
                </Link>
              </>
            ) : null}
            {isAdmin ? (
              <>
                <div className="my-6 border-t border-slate-200" />
                <p className="px-3 pb-2 text-xs font-semibold text-slate-400">ADMIN</p>
                <Link
                  href="/admin/daily-logs"
                  aria-current={activeItem === "daily-logs" ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
                    activeItem === "daily-logs"
                      ? "bg-blue-100 font-semibold text-brand"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <CheckCircle2 size={19} />
                  Persetujuan
                </Link>
                <Link
                  href="/admin/libur-cuti"
                  aria-current={activeItem === "libur-cuti" ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
                    activeItem === "libur-cuti"
                      ? "bg-blue-100 font-semibold text-brand"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <CalendarOff size={19} />
                  Libur &amp; Cuti
                </Link>
                <Link
                  href="/admin/pengguna"
                  aria-current={activeItem === "pengguna" ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 ${
                    activeItem === "pengguna"
                      ? "bg-blue-100 font-semibold text-brand"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Users size={19} />
                  Pengguna
                </Link>
              </>
            ) : null}
          </nav>

          {isAtasanPage && (
            <div className="mt-auto border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-slate-800">
                Akun Atasan
              </p>
              <p className="text-xs text-slate-500">Atasan</p>
            </div>
          )}
        </div>
      </aside>

      <nav
        className={`fixed inset-x-3 bottom-3 z-10 grid ${mobileGridClass} rounded-2xl border border-slate-200 bg-white/95 p-1.5 text-[11px] font-medium shadow-lg backdrop-blur md:hidden`}
        aria-label="Navigasi utama"
      >
        {isAtasanPage ? (
          <Link
            href="/atasan/tim"
            aria-current="page"
            className="col-span-5 flex flex-col items-center gap-1 rounded-xl bg-blue-50 px-1 py-2 text-brand"
          >
            <Users size={18} />
            Tim
          </Link>
        ) : (
          <>
            <Link
              href="/"
              className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-slate-600"
            >
              <FileText size={18} />
              Daily Log
            </Link>
            <Link
              href="/jejak"
              className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-slate-600"
            >
              <History size={18} />
              Jejak
            </Link>
            <Link
              href="/ringkasan"
              aria-current={activeItem === "ringkasan" ? "page" : undefined}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 ${
                activeItem === "ringkasan" ? "bg-blue-50 text-brand" : "text-slate-600"
              }`}
            >
              <BarChart3 size={18} />
              Ringkasan
            </Link>
            <Link
              href="/contoh"
              className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-slate-600"
            >
              <BookOpen size={18} />
              Panduan
            </Link>
            <Link
              href="/pengaturan"
              className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-slate-600"
            >
              <Settings size={18} />
              Pengaturan
            </Link>
            {canAccessTeam ? (
              <Link
                href="/atasan/tim"
                aria-current={isTeamActive ? "page" : undefined}
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 ${
                  isTeamActive ? "bg-blue-50 text-brand" : "text-slate-600"
                }`}
              >
                <Users size={18} />
                Tim
              </Link>
            ) : null}
          </>
        )}
        {isAdmin ? (
          <>
            <Link
              href="/admin/daily-logs"
              aria-current={activeItem === "daily-logs" ? "page" : undefined}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 ${
                activeItem === "daily-logs" ? "bg-blue-50 text-brand" : "text-slate-600"
              }`}
            >
              <CheckCircle2 size={18} />
              Persetujuan
            </Link>
            <Link
              href="/admin/libur-cuti"
              aria-current={activeItem === "libur-cuti" ? "page" : undefined}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 ${
                activeItem === "libur-cuti" ? "bg-blue-50 text-brand" : "text-slate-600"
              }`}
            >
              <CalendarOff size={18} />
              Libur &amp; Cuti
            </Link>
            <Link
              href="/admin/pengguna"
              aria-current={activeItem === "pengguna" ? "page" : undefined}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 ${
                activeItem === "pengguna" ? "bg-blue-50 text-brand" : "text-slate-600"
              }`}
            >
              <Users size={18} />
              Pengguna
            </Link>
          </>
        ) : null}
      </nav>
    </>
  );
}
