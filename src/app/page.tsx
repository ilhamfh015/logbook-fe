import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { TaskShowcase } from "@/components/preview/TaskShowcase";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <section className="min-w-0 flex-1" id="logbook">
          <AppHeader />
          <div className="mx-5 mt-6 flex items-center gap-4 lg:mx-8">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-lg font-bold text-brand">
              LB
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Log Book</h2>
              <p className="mt-1 text-sm text-slate-600">
                Catat pekerjaan harianmu selama bekerja.
              </p>
            </div>
          </div>
          <TaskShowcase />
        </section>
      </div>
    </main>
  );
}
