import { RolePageGuard } from "@/components/auth/RolePageGuard";
import { TeamDashboard } from "@/components/atasan/TeamDashboard";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";

export default function AdminTimRoute() {
  return (
    <RolePageGuard access="admin">
      <main className="min-h-screen bg-surface text-ink">
        <div className="flex min-h-screen w-full">
          <AppSidebar activeItem="admin-tim" />
          <section className="min-w-0 flex-1">
            <AppHeader />
            <TeamDashboard audience="admin" />
          </section>
        </div>
      </main>
    </RolePageGuard>
  );
}
