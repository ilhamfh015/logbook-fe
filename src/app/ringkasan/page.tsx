import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { RingkasanPageContent } from "@/components/ringkasan/RingkasanPageContent";

export default function RingkasanPage() {
  return (
    <main className="min-h-screen bg-surface text-ink">
      <div className="flex min-h-screen w-full">
        <AppSidebar activeItem="ringkasan" />
        <section className="min-w-0 flex-1">
          <AppHeader />
          <RingkasanPageContent />
        </section>
      </div>
    </main>
  );
}
