import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { RolePageGuard } from "@/components/auth/RolePageGuard";
import { TeamDashboard } from "@/components/atasan/TeamDashboard";

export default function TeamPage() {
  return (
    <RolePageGuard access="team">
      <main className="min-h-screen bg-surface text-ink">
        <div className="flex min-h-screen w-full">
          <AppSidebar activeItem="tim" />
          <section className="min-w-0 flex-1">
            <AppHeader />
            <TeamDashboard />
          </section>
        </div>
      </main>
    </RolePageGuard>
  );
}
