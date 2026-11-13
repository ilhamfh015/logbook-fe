import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AdminLeaveHolidayPage } from "@/components/admin/AdminLeaveHolidayPage";

export default function AdminLeavePage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <div className="flex min-h-screen w-full">
        <AppSidebar activeItem="libur-cuti" />
        <section className="min-w-0 flex-1">
          <AppHeader />
          <AdminLeaveHolidayPage />
        </section>
      </div>
    </main>
  );
}
