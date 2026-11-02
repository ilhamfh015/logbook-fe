import { AppSidebar } from "@/components/layout/AppSidebar";
import { TaskShowcase } from "@/components/preview/TaskShowcase";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <section className="min-w-0 flex-1 p-5 lg:p-8" id="logbook">
          <header className="flex items-center justify-between gap-4">
            <div><p className="text-sm font-semibold text-brand">Log Book</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Komponen UI dasar</h1><p className="mt-2 text-sm text-slate-500">Fondasi tampilan untuk mencatat pekerjaan harian talent.</p></div>
            <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 sm:inline-flex">Preparation · C1 &amp; C2</span>
          </header>
          <TaskShowcase />
        </section>
      </div>
    </main>
  );
}
