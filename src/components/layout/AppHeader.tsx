"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, FileText, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isAtasanPage = pathname.startsWith("/atasan");
  const isAdminPage = pathname.startsWith("/admin");
  const isSettingsPage = pathname.startsWith("/pengaturan");

  const roleLabel = user?.roles.includes("ATASAN")
    ? "Atasan"
    : user?.roles.includes("ADMIN")
      ? "Admin"
      : "Talent";

  useEffect(() => {
    if (!notificationsOpen && !profileOpen) return;

    const timer = window.setTimeout(() => {
      setNotificationsOpen(false);
      setProfileOpen(false);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [notificationsOpen, profileOpen]);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;

      if (!notificationRef.current?.contains(target)) {
        setNotificationsOpen(false);
      }

      if (!profileRef.current?.contains(target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, []);

  const displayName = user?.fullName ?? "Pengguna";

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    router.replace("/login");
  };

  return (
    <header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200/70 px-5 py-3 lg:px-8">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <FileText size={16} />
        <span aria-hidden="true">›</span>
        <span className="font-medium text-ink">
          {isSettingsPage
            ? "Pengaturan"
            : isAtasanPage
              ? "Tim"
              : isAdminPage
                ? "Libur & Cuti"
                : "Log Book"}
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div ref={notificationRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setProfileOpen(false);
            }}
            aria-label="Notifikasi"
            aria-expanded={notificationsOpen}
            className="relative rounded-full border border-blue-100 bg-white p-2.5 text-slate-700 shadow-sm hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand" />
          </button>

          {notificationsOpen && (
            <div
              role="status"
              className="absolute right-0 top-12 z-40 w-64 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-lg"
            >
              <p className="font-semibold text-ink">Notifikasi</p>
              <p className="mt-2 text-slate-500">Belum ada notifikasi baru.</p>
            </div>
          )}
        </div>

        <div className="hidden h-7 w-px bg-slate-200 sm:block" />

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((open) => !open);
              setNotificationsOpen(false);
            }}
            aria-label={`Menu akun ${displayName}`}
            aria-expanded={profileOpen}
            className="flex items-center gap-3 rounded-xl p-1.5 text-left hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-brand">
              {initials}
            </span>

            <span className="hidden text-xs sm:block">
              <span className="block font-bold text-ink">{displayName}</span>
              <span className="text-slate-500">{roleLabel}</span>
            </span>

            <ChevronDown size={17} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-14 z-40 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <p className="truncate px-3 py-2 text-xs text-slate-500">
                {user?.email ?? "Belum login"}
              </p>

              <Link
                href="/pengaturan"
                onClick={() => setProfileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50"
              >
                Pengaturan akun
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut size={15} />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
