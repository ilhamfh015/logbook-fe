"use client";

import { useEffect, useState } from "react";
import { TimelinePreview } from "@/components/preview/TimelinePreview";
import { TaskForm } from "@/components/task/TaskForm";
import { SidePanel } from "@/components/shared/SidePanel";
import type { TaskDraft } from "@/types/task";

export function TaskShowcase() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date(2026, 9, 29));
  const [notice, setNotice] = useState("");
  const [savedTasks, setSavedTasks] = useState<TaskDraft[]>([]);

  useEffect(() => {
    let mounted = true;
    const restoreTasks = () => {
      try {
        const storedValue: unknown = JSON.parse(window.localStorage.getItem("logbook-task-drafts") ?? "[]");
        if (mounted && Array.isArray(storedValue)) setSavedTasks(storedValue.filter(isTaskDraft));
      } catch {
        if (mounted) setSavedTasks([]);
      }
    };
    window.queueMicrotask(restoreTasks);
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const saveTask = (task: TaskDraft) => {
    try {
      const storedValue: unknown = JSON.parse(window.localStorage.getItem("logbook-task-drafts") ?? "[]");
      const existingTasks = Array.isArray(storedValue) ? storedValue.filter(isTaskDraft) : [];
      window.localStorage.setItem("logbook-task-drafts", JSON.stringify([...existingTasks, task]));
      setNotice("Task tersimpan di browser ini.");
    } catch {
      setNotice("Task ditambahkan untuk sesi ini. Penyimpanan browser tidak tersedia.");
    }
    setSavedTasks((current) => [...current, task]);
    setPanelOpen(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] min-w-0 pb-24 md:pb-0">
      <TimelinePreview date={selectedDate} onChangeDate={setSelectedDate} onAddTask={() => { setNotice(""); setPanelOpen(true); }} savedTasks={savedTasks} />
      <SidePanel title="Tambah Task" open={panelOpen} onClose={() => setPanelOpen(false)}><TaskForm onCancel={() => setPanelOpen(false)} onSave={saveTask} /></SidePanel>
      {!panelOpen ? <button type="button" onClick={() => setPanelOpen(true)} className="fixed bottom-24 right-4 z-10 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 md:bottom-6 md:right-6">+ Tambah task</button> : null}
      {notice ? <div role="status" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg md:bottom-6">{notice}</div> : null}
    </div>
  );
}

function isTaskDraft(value: unknown): value is TaskDraft {
  if (!value || typeof value !== "object") return false;
  const task = value as Partial<TaskDraft>;
  return typeof task.project === "string"
    && typeof task.ticket === "string"
    && typeof task.startTime === "string"
    && typeof task.durationMinutes === "number"
    && Number.isFinite(task.durationMinutes)
    && task.durationMinutes >= 5
    && typeof task.type === "string"
    && typeof task.summary === "string"
    && (task.workStatus === "SELESAI" || task.workStatus === "BERJALAN" || task.workStatus === "TERTAHAN");
}
