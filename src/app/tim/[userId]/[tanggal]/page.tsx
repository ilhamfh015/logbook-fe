import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DailyLogReview } from "@/components/review/DailyLogReview";

type ReviewPageProps = {
  params: Promise<{ userId: string; tanggal: string }>;
};

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { userId, tanggal } = await params;

  return (
    <main className="min-h-screen bg-surface text-ink">
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <section className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          {isValidDateIso(tanggal) ? (
            <DailyLogReview userId={userId} dateIso={tanggal} />
          ) : (
            <div className="flex min-h-[calc(100vh-64px)] flex-col items-start gap-3 p-6">
              <p className="text-sm text-slate-700">Alamat tidak valid</p>
              <Link href="/tim" className="text-sm font-medium text-blue-700 underline underline-offset-2">
                Kembali ke Tim
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function isValidDateIso(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
}