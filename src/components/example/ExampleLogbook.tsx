import { helpfulExamples, writingTips } from "@/lib/exampleContent";
import Link from "next/link";

export function ExampleLogbook() {
  return (
    <main className="min-h-screen bg-surface px-5 py-8 text-ink lg:px-10">
      <div className="mx-auto max-w-[1200px]">
        <Link
          href="/"
          className="text-sm font-medium text-brand hover:underline"
        >
          ‹ Kembali ke Daily Log
        </Link>
        <header className="mt-3">
          <h1 className="text-3xl font-bold tracking-tight">Contoh Log Book</h1>
          <p className="mt-1 text-base text-slate-600">
            Pekerjaan yang sama, ditulis dengan dua cara. Mana yang lebih
            membantu orang yang membacanya?
          </p>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <ExampleCard helpful title="Membantu pembaca">
            <div className="divide-y divide-slate-100">
              {helpfulExamples.map((item) => (
                <article key={item.title} className="py-4 first:pt-0 last:pb-0">
                  <h2 className="text-sm font-bold">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {item.text}
                  </p>
                  {item.note ? (
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {item.note}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </ExampleCard>
          <ExampleCard title="Kurang membantu pembaca">
            <div className="flex h-full flex-col">
              <article>
                <h2 className="text-sm font-bold">
                  Pengembangan · 8 j · Selesai
                </h2>
                <p className="mt-1 text-sm text-slate-700">Ngoding</p>
              </article>
              <p className="mt-auto rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Pembaca tidak tahu apa yang dikerjakan, apa hasilnya, dan apa
                yang masih berjalan. Rekap mingguanmu juga hanya akan berisi
                “Pengembangan 8 j”.
              </p>
            </div>
          </ExampleCard>
        </section>

        <section className="mt-6 grid gap-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
          {writingTips.map((tip) => (
            <article key={tip.title}>
              <h2 className="text-sm font-bold">{tip.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {tip.text}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function ExampleCard({
  title,
  helpful = false,
  children,
}: {
  title: string;
  helpful?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`flex flex-col rounded-xl border bg-white p-6 shadow-sm ${helpful ? "border-2 border-brand" : "border-slate-200"}`}
    >
      <span
        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${helpful ? "bg-blue-50 text-brand" : "bg-slate-100 text-slate-600"}`}
      >
        {title}
      </span>
      <div className="mt-4 flex-1 border-t border-slate-100 pt-1">
        {children}
      </div>
    </article>
  );
}
