import Link from "next/link";
import { ArrowLeft, Clock3 } from "lucide-react";

export function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return <main className="min-h-screen bg-surface px-5 py-8 text-ink sm:px-8"><div className="mx-auto max-w-3xl"><Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"><ArrowLeft size={16} />Kembali ke Log Book</Link><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-brand"><Clock3 size={23} /></span><h1 className="mt-5 text-2xl font-bold">{title}</h1><p className="mt-2 max-w-xl leading-6 text-slate-600">{description}</p><p className="mt-6 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">Halaman ini belum tersedia.</p></section></div></main>;
}
