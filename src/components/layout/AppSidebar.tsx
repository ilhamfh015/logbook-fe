"use client";

type AppSidebarProps = { activeItem?: "logbook" | "jejak" };

export function AppSidebar({ activeItem = "logbook" }: AppSidebarProps) {
  return (
    <aside className="hidden w-52 shrink-0 border-r border-slate-200 bg-white md:block" aria-label="Navigasi utama">
      <div className="sticky top-0 p-5">
        <p className="px-2 text-lg font-bold text-brand">HRMS</p>
        <nav className="mt-8 space-y-1 text-sm">
          <a href="#logbook" className={`block rounded-lg px-3 py-2 font-semibold ${activeItem === "logbook" ? "bg-blue-50 text-brand" : "text-slate-500 hover:bg-slate-50"}`}>Log Book</a>
          <a href="#jejak" className={`block rounded-lg px-3 py-2 ${activeItem === "jejak" ? "bg-blue-50 font-semibold text-brand" : "text-slate-500 hover:bg-slate-50"}`}>Jejak</a>
        </nav>
      </div>
    </aside>
  );
}
