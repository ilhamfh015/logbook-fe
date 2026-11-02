"use client";

import { useState } from "react";
import { ProjectChip } from "@/components/shared/ProjectChip";
import { SidePanel } from "@/components/shared/SidePanel";
import { StatusSegmented } from "@/components/shared/StatusSegmented";
import { TaskTypePill } from "@/components/shared/TaskTypePill";
import { taskTypes } from "@/lib/taskOptions";
import type { WorkStatus } from "@/types/task";

export function TaskShowcase() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedProject, setSelectedProject] = useState("Bank XYZ · Mobile Banking");
  const [selectedType, setSelectedType] = useState("Pengembangan");
  const [status, setStatus] = useState<WorkStatus>("BERJALAN");

  return (
    <>
      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4"><div><h2 className="font-semibold">Kamis, 29 Okt 2026</h2><p className="mt-1 text-xs text-slate-500">Preview komponen untuk task UI dasar</p></div><span className="text-sm text-slate-500">Total 7 j</span></div>
        <div className="mt-4 flex flex-wrap gap-2"><ProjectChip name="Bank XYZ" color="blue" hours="5 j" selected={selectedProject.startsWith("Bank XYZ")} onClick={() => setSelectedProject("Bank XYZ · Mobile Banking")} /><ProjectChip name="Asuransi ABC" color="orange" hours="3 j 30" selected={selectedProject.startsWith("Asuransi ABC")} onClick={() => setSelectedProject("Asuransi ABC · Klaim")} /></div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2"><TaskPreview color="blue" project="BANK XYZ" title="Pengembangan · ABC-151 · 2 j" description="Paginasi riwayat transaksi selesai, menunggu review." /><TaskPreview color="orange" project="ASURANSI ABC" title="Perbaikan bug · INC-88 · 2 j" description="Laporan klaim gagal diekspor ke PDF." /></div>
      </section>
      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:p-6"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Task drawer controls</p><button type="button" onClick={() => setPanelOpen(true)} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">Tambah task</button></div><div className="mt-4 flex flex-wrap gap-2">{taskTypes.map((type) => <TaskTypePill key={type} type={type} selected={selectedType === type} onClick={() => setSelectedType(type)} />)}</div><div className="mt-5 max-w-xl"><StatusSegmented value={status} onChange={setStatus} /></div></section>
      <SidePanel title="Tambah task · 16.00" open={panelOpen} onClose={() => setPanelOpen(false)} footer={<PanelActions onCancel={() => setPanelOpen(false)} />}><div className="space-y-5"><div><p className="mb-2 text-sm font-semibold">Proyek</p><div className="flex flex-wrap gap-2"><ProjectChip name="Bank XYZ · Mobile Banking" color="blue" selected={selectedProject.startsWith("Bank XYZ")} onClick={() => setSelectedProject("Bank XYZ · Mobile Banking")} /><ProjectChip name="Asuransi ABC · Klaim" color="orange" selected={selectedProject.startsWith("Asuransi ABC")} onClick={() => setSelectedProject("Asuransi ABC · Klaim")} /></div></div><div><p className="mb-2 text-sm font-semibold">Jenis task</p><div className="flex flex-wrap gap-2">{taskTypes.map((type) => <TaskTypePill key={type} type={type} selected={selectedType === type} onClick={() => setSelectedType(type)} />)}</div></div><div><p className="mb-2 text-sm font-semibold">Status</p><StatusSegmented value={status} onChange={setStatus} /></div></div></SidePanel>
    </>
  );
}

function TaskPreview({ color, project, title, description }: { color: "blue" | "orange"; project: string; title: string; description: string }) {
  return <div className={`rounded-lg border p-4 ${color === "blue" ? "border-blue-200 bg-blue-50" : "border-orange-200 bg-orange-50"}`}><ProjectChip name={project} color={color} /><p className="mt-3 text-sm font-semibold">{title}</p><p className="mt-1 text-sm text-slate-600">{description}</p></div>;
}

function PanelActions({ onCancel }: { onCancel: () => void }) {
  return <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button><button type="button" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Simpan task</button></div>;
}
