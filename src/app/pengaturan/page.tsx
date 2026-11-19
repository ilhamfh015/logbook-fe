import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SettingsPageContent } from "@/components/settings/SettingsPageContent";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <div className="flex min-h-screen w-full">
        <AppSidebar activeItem="pengaturan" />
        <section className="min-w-0 flex-1">
          <AppHeader />
          <SettingsPageContent />
        </section>
      </div>
    </main>
  );
}
