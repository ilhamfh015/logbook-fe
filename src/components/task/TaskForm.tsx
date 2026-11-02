"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ProjectChip } from "@/components/shared/ProjectChip";
import { StatusSegmented } from "@/components/shared/StatusSegmented";
import { TaskTypePill } from "@/components/shared/TaskTypePill";
import { taskTypes } from "@/lib/taskOptions";
import type { TaskDraft, TaskType, WorkStatus } from "@/types/task";

type TaskFormProps = { onCancel: () => void; onSave: (task: TaskDraft) => void };

const projects = [
  { name: "Bank XYZ - Mobile Banking", color: "blue" as const },
  { name: "Asuransi ABC - Klaim", color: "orange" as const },
  { name: "Internal Padepokan", color: "blue" as const },
];

export function TaskForm({ onCancel, onSave }: TaskFormProps) {
  const [project, setProject] = useState(projects[0].name);
  const [projectOtherOpen, setProjectOtherOpen] = useState(false);
  const [projectOther, setProjectOther] = useState("");
  const [type, setType] = useState<TaskType>("Pengembangan");
  const [status, setStatus] = useState<WorkStatus>("BERJALAN");
  const [duration, setDuration] = useState("60");
  const [customDuration, setCustomDuration] = useState("30");
  const [summary, setSummary] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const finalProject = projectOtherOpen ? projectOther.trim() : project;
    const durationMinutes = duration === "other" ? Number(customDuration) : Number(duration);
    const cleanSummary = summary.trim();
    if (!finalProject || !cleanSummary || !Number.isFinite(durationMinutes) || durationMinutes < 5) return;

    onSave({
      project: finalProject,
      ticket: String(formData.get("ticket") ?? "").trim(),
      startTime: String(formData.get("startTime") ?? "16:00"),
      durationMinutes,
      type,
      summary: cleanSummary,
      workStatus: status,
    });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Proyek <span className="text-brand">*</span></legend>
        <div className="flex flex-wrap gap-2">
          {projects.map((item) => <ProjectChip key={item.name} name={item.name} color={item.color} selected={!projectOtherOpen && project === item.name} onClick={() => { setProject(item.name); setProjectOtherOpen(false); }} />)}
          <button type="button" aria-pressed={projectOtherOpen} onClick={() => { setProjectOtherOpen(true); setProject(""); }} className={`rounded-full border border-dashed px-3 py-1.5 text-xs font-medium transition ${projectOtherOpen ? "border-brand bg-blue-50 text-brand" : "border-slate-300 text-slate-600 hover:border-brand hover:text-brand"}`}>+ Proyek lain</button>
        </div>
        {projectOtherOpen ? <input autoFocus required name="projectOther" value={projectOther} onChange={(event) => setProjectOther(event.target.value)} className="field-control mt-3" placeholder="Nama proyek" aria-label="Nama proyek baru" /> : null}
      </fieldset>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <label className="col-span-2 sm:col-span-1"><span className="mb-2 block text-sm font-semibold">Tiket <span className="font-normal text-slate-400">(opsional)</span></span><input name="ticket" className="field-control" placeholder="ABC-153" /></label>
        <label><span className="mb-2 block text-sm font-semibold">Mulai <span className="text-brand">*</span></span><input name="startTime" className="field-control" type="time" defaultValue="16:00" required /></label>
        <label><span className="mb-2 block text-sm font-semibold">Durasi <span className="text-brand">*</span></span><select name="duration" className="field-control" value={duration} onChange={(event) => setDuration(event.target.value)}><option value="15">15 m</option><option value="30">30 m</option><option value="60">1 j</option><option value="90">1,5 j</option><option value="120">2 j</option><option value="other">Lainnya</option></select></label>
      </div>
      {duration === "other" ? <label className="block"><span className="mb-2 block text-sm font-semibold">Durasi (menit)</span><input className="field-control max-w-40" type="number" min="5" step="5" value={customDuration} onChange={(event) => setCustomDuration(event.target.value)} required /></label> : null}

      <fieldset><legend className="mb-2 text-sm font-semibold">Jenis task <span className="text-brand">*</span></legend><div className="flex flex-wrap gap-2">{taskTypes.map((item) => <TaskTypePill key={item} type={item} selected={type === item} onClick={() => setType(item)} />)}</div></fieldset>

      <div>
        <label htmlFor="task-summary" className="mb-2 block text-sm font-semibold">Ringkasan dan hasil <span className="text-brand">*</span></label>
        <div className="relative"><textarea id="task-summary" name="summary" className="field-control min-h-24 resize-y pb-7" placeholder="Apa yang dikerjakan, hasilnya, buktinya." maxLength={500} value={summary} onChange={(event) => setSummary(event.target.value)} required /><span className="absolute bottom-2 right-3 text-xs text-slate-400">{summary.length}/500</span></div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-semibold text-slate-600">Tulis: apa · hasil · bukti</span><Link href="/contoh" className="font-medium text-brand underline-offset-2 hover:underline">Lihat contoh</Link></div>
      </div>

      <fieldset><legend className="mb-2 text-sm font-semibold">Status <span className="text-brand">*</span></legend><StatusSegmented value={status} onChange={setStatus} /></fieldset>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Batal</button><button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">Simpan task</button></div>
    </form>
  );
}
