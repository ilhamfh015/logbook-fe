import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AdminDailyLogPage } from "@/components/admin/AdminDailyLogPage";

export default function AdminDailyLogsRoute() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <div className="flex min-h-screen w-full">
        <AppSidebar activeItem="daily-logs" />
        <section className="min-w-0 flex-1">
          <AppHeader />
          <AdminDailyLogPage />
        </section>
      </div>
    </main>
  );
}
