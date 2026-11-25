import Link from "next/link";
import { RolePageGuard } from "@/components/auth/RolePageGuard";
import { DailyLogReview } from "@/components/review/DailyLogReview";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";

type AdminReviewPageProps = {
  params: Promise<{ userId: string; tanggal: string }>;
};

export default async function AdminReviewPage({ params }: AdminReviewPageProps) {
  const { userId, tanggal } = await params;

  return (
    <RolePageGuard access="admin">
      <main className="min-h-screen bg-surface text-ink">
        <div className="flex min-h-screen w-full">
          <AppSidebar activeItem="admin-tim" />
          <section className="flex min-w-0 flex-1 flex-col">
            <AppHeader />
            {isValidDateIso(tanggal) ? (
              <DailyLogReview
                userId={userId}
                dateIso={tanggal}
                backHref="/admin/tim"
              />
            ) : (
              <div className="flex min-h-[calc(100vh-64px)] flex-col items-start gap-3 p-6">
                <p className="text-sm text-slate-700">Alamat tidak valid</p>
                <Link
                  href="/admin/tim"
                  className="text-sm font-medium text-blue-700 underline underline-offset-2"
                >
                  Kembali ke Tim
                </Link>
              </div>
            )}
          </section>
        </div>
      </main>
    </RolePageGuard>
  );
}

function isValidDateIso(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
}
