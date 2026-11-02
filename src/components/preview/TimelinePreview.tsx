import { ChevronLeft, ChevronRight, Coffee, Folder, Home, Info, Play, Plus } from "lucide-react";
import { ProjectChip } from "@/components/shared/ProjectChip";
import type { TaskDraft } from "@/types/task";

const hourLabels = Array.from({ length: 10 }, (_, index) => `${String(index + 8).padStart(2, "0")}.00`);

type TimelineTask = {
  id: string;
  project: string;
  title: string;
  description: string;
  tone: "blue" | "orange";
  startSlot: number;
  durationSlots: number;
  column: "full" | "left" | "right";
  badge?: string;
};

const tasks: TimelineTask[] = [
  { id: "abc-151", project: "BANK XYZ", title: "Pengembangan · ABC-151 · 2 j", description: "Paginasi riwayat transaksi selesai, menunggu review.", tone: "blue", startSlot: 1, durationSlots: 4, column: "full" },
  { id: "inc-88", project: "ASURANSI ABC", title: "Perbaikan bug · INC-88 · 2 j", description: "Laporan klaim gagal diekspor ke PDF. Penyebab: font tidak tertanam. Diperbaiki di staging.", tone: "orange", startSlot: 5, durationSlots: 4, column: "full" },
  { id: "abc-153", project: "BANK XYZ", title: "Pengembangan · ABC-153 · 3 j", description: "Form transfer antarbank: validasi nominal dan rekening tujuan. Sebagian besar selesai, sisa pesan galat.", tone: "blue", startSlot: 11, durationSlots: 6, column: "left", badge: "Berjalan" },
  { id: "support", project: "ASURANSI ABC", title: "Lainnya · Siaga support · 1,5 j", description: "Siaga rilis; 1 pertanyaan user dijawab.", tone: "orange", startSlot: 11, durationSlots: 3, column: "right" },
];

type TimelinePreviewProps = { date: Date; onChangeDate: (date: Date) => void; onAddTask: () => void; savedTasks: TaskDraft[] };

export function TimelinePreview({ date, onChangeDate, onAddTask, savedTasks }: TimelinePreviewProps) {
  const formattedDate = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).format(date);
  const moveDate = (days: number) => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    onChangeDate(nextDate);
  };

  return (
    <section className="min-w-0 flex-1 p-4 sm:p-5 lg:p-7">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500"><Home size={16} /><span aria-hidden="true">›</span><span className="font-medium text-ink">Log Book</span><span aria-hidden="true">›</span><span className="font-semibold text-ink">{formattedDate}</span></div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button type="button" onClick={() => moveDate(-1)} className="rounded-xl border border-slate-200 bg-white p-2 text-ink shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label="Hari sebelumnya"><ChevronLeft size={19} /></button>
          <h1 className="text-lg font-bold tracking-tight sm:text-2xl lg:text-3xl">{formattedDate}</h1>
          <button type="button" onClick={() => moveDate(1)} className="rounded-xl border border-slate-200 bg-white p-2 text-ink shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand" aria-label="Hari berikutnya"><ChevronRight size={19} /></button>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-500 sm:text-sm"> <span>Total</span><strong className="text-ink">7 j</strong><span className="hidden sm:inline">(paralel dihitung sekali)</span><details className="relative"><summary className="list-none cursor-pointer rounded p-1 hover:bg-blue-50" aria-label="Tentang perhitungan total jam"><Info size={15} /></summary><span className="absolute right-0 top-7 z-20 w-56 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600 shadow-lg">Rentang task yang waktunya bersamaan dihitung satu kali pada total harian.</span></details></div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2"><ProjectChip name="Bank XYZ" color="blue" hours="5 j" /><ProjectChip name="Asuransi ABC" color="orange" hours="3 j 30 m" /></div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:p-3 lg:p-4">
        <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-2 sm:grid-cols-[3.75rem_minmax(0,1fr)] sm:gap-3">
          <div aria-hidden="true" className="grid grid-cols-1" style={{ gridTemplateRows: "repeat(18, minmax(0, 40px)) 24px" }}>{hourLabels.map((hour, index) => <div key={hour} className="pt-1 text-xs font-medium text-slate-500 sm:text-sm" style={{ gridRow: index === 9 ? 19 : index * 2 + 1 }}>{hour}</div>)}</div>
          <div className="relative grid min-w-0 grid-cols-3 gap-x-1.5 sm:gap-x-2" style={{ gridTemplateRows: "repeat(18, minmax(0, 40px)) 24px" }}>
            {Array.from({ length: 18 }, (_, index) => <div key={index} className="col-span-3 border-t border-slate-100" style={{ gridRow: index + 1 }} />)}
            {tasks.map((task) => <TimelineBlock key={task.id} task={task} />)}
            <div className="z-10 flex items-center rounded-xl border border-dashed border-slate-300 bg-white px-3 text-sm text-slate-500" style={{ gridRow: "9 / span 2", gridColumn: "1 / -1" }}><Coffee size={18} className="mr-3 shrink-0" />Istirahat</div>
          </div>
        </div>
        <button type="button" onClick={onAddTask} className="ml-[3.75rem] mt-3 flex h-12 w-[calc(100%-3.75rem)] items-center justify-center rounded-xl border border-dashed border-brand bg-white text-sm font-semibold text-brand transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:ml-[4.5rem] sm:w-[calc(100%-4.5rem)]"><Plus size={18} className="mr-2" />Tambah task mulai 16.00</button>
      </div>
      {savedTasks.length > 0 ? <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-live="polite"><h2 className="text-sm font-bold">Task tambahan di sesi ini</h2><ul className="mt-3 divide-y divide-slate-100">{savedTasks.map((task, index) => <li key={`${task.startTime}-${task.ticket}-${index}`} className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0 last:pb-0"><div><p className="text-sm font-semibold">{task.type}{task.ticket ? ` · ${task.ticket}` : ""}</p><p className="mt-1 text-xs text-slate-500">{task.project} · {task.startTime} · {task.durationMinutes} menit</p><p className="mt-1 text-sm text-slate-600">{task.summary}</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{task.workStatus === "SELESAI" ? "Selesai" : task.workStatus === "BERJALAN" ? "Berjalan" : "Tertahan"}</span></li>)}</ul></section> : null}
    </section>
  );
}

function TimelineBlock({ task }: { task: TimelineTask }) {
  const orange = task.tone === "orange";
  const gridColumn = task.column === "full" ? "1 / -1" : task.column === "left" ? "1 / span 2" : "3";
  return (
    <article className={`z-10 min-w-0 overflow-hidden rounded-xl border p-2.5 sm:p-3 lg:p-4 ${orange ? "border-orange-200 bg-orange-50" : "border-blue-200 bg-blue-50"}`} style={{ gridRow: `${task.startSlot} / span ${task.durationSlots}`, gridColumn }}>
      <span className={`inline-flex max-w-full items-center gap-2 truncate rounded-full px-2.5 py-1 text-[10px] font-bold sm:px-3 sm:text-xs ${orange ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}><Folder size={13} className="shrink-0" />{task.project}</span>
      <p className="mt-2 text-xs font-bold text-ink sm:text-sm">{task.title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-700 sm:text-sm">{task.description}</p>
      {task.badge ? <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700"><Play size={12} />{task.badge}</span> : null}
    </article>
  );
}
