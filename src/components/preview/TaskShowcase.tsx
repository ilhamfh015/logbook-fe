"use client";

import { useEffect, useState } from "react";
import { TimelinePreview } from "@/components/preview/TimelinePreview";
import { TaskForm } from "@/components/task/TaskForm";
import { SidePanel } from "@/components/shared/SidePanel";
import type { TaskDraft } from "@/types/task";

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function TaskShowcase() {
  const [panelOpen, setPanelOpen] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState("16:00");
  const [selectedDate, setSelectedDate] = useState(() => new Date(2026, 9, 29));
  const [notice, setNotice] = useState("");
  const [savedTasks, setSavedTasks] = useState<TaskDraft[]>([]);
  const [editingTask, setEditingTask] = useState<TaskDraft | null>(null);

  useEffect(() => {
    let mounted = true;
    const restoreTasks = () => {
      try {
        const storedValue: unknown = JSON.parse(
          window.localStorage.getItem("logbook-task-drafts") ?? "[]",
        );
        if (mounted && Array.isArray(storedValue))
          setSavedTasks(
            storedValue.filter(isTaskDraft).map((task, index) => ({
              ...task,
              id: task.id ?? `task-${index}`,
            })),
          );
      } catch {
        if (mounted) setSavedTasks([]);
      }
    };
    window.queueMicrotask(restoreTasks);
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const saveTask = (task: TaskDraft) => {
    const savedTask = {
      ...task,
      date: formatDateKey(selectedDate),
      id: task.id ?? `task-${Date.now()}`,
      deletedAt: undefined,
    };
    try {
      const storedValue: unknown = JSON.parse(
        window.localStorage.getItem("logbook-task-drafts") ?? "[]",
      );
      const existingTasks = Array.isArray(storedValue)
        ? storedValue.filter(isTaskDraft)
        : [];
      const nextTasks = savedTasks.some((item) => item.id === savedTask.id)
        ? existingTasks.map((item) =>
            item.id === savedTask.id ? savedTask : item,
          )
        : [...existingTasks, savedTask];
      window.localStorage.setItem(
        "logbook-task-drafts",
        JSON.stringify(nextTasks),
      );
      setNotice(
        task.id ? "Task diperbarui." : "Task tersimpan di browser ini.",
      );
    } catch {
      setNotice(
        "Task ditambahkan untuk sesi ini. Penyimpanan browser tidak tersedia.",
      );
    }
    setSavedTasks((current) =>
      current.some((item) => item.id === savedTask.id)
        ? current.map((item) => (item.id === savedTask.id ? savedTask : item))
        : [...current, savedTask],
    );
    setPanelOpen(false);
  };

  const deleteTask = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDeleteTask = () => {
    if (!pendingDeleteId) return;

    const nextTasks = savedTasks.map((task) =>
      task.id === pendingDeleteId
        ? { ...task, deletedAt: new Date().toISOString() }
        : task,
    );

    setSavedTasks(nextTasks);
    window.localStorage.setItem(
      "logbook-task-drafts",
      JSON.stringify(nextTasks),
    );

    setPendingDeleteId(null);
    setNotice("Task dipindahkan ke arsip.");
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] min-w-0 pb-24 md:pb-0">
      <TimelinePreview
        date={selectedDate}
        onChangeDate={setSelectedDate}
        onAddTask={(time) => {
          setNotice("");
          setStartTime(time ?? "16:00");
          setEditingTask(null);
          setPanelOpen(true);
        }}
        savedTasks={savedTasks}
        onEditTask={(task) => {
          setEditingTask(task);
          setPanelOpen(true);
        }}
        onDeleteTask={deleteTask}
      />
      <SidePanel
        title={editingTask ? "Edit Task" : "Tambah Task"}
        open={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setEditingTask(null);
        }}
      >
        <TaskForm
          initialStartTime={startTime}
          initialTask={editingTask}
          onCancel={() => {
            setPanelOpen(false);
            setEditingTask(null);
          }}
          onSave={(task) => {
            saveTask(task);
            setEditingTask(null);
          }}
        />
      </SidePanel>
      {!panelOpen ? (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="fixed bottom-24 right-4 z-10 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 md:bottom-6 md:right-6"
        >
          + Tambah task
        </button>
      ) : null}
      {notice ? (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg md:bottom-6"
        >
          {notice}
        </div>
      ) : null}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2
              id="delete-dialog-title"
              className="text-lg font-semibold text-slate-900"
            >
              Pindahkan task ke arsip?
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Task ini akan dipindahkan ke arsip. Kamu bisa membatalkan tindakan
              ini.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={confirmDeleteTask}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Ya, pindahkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function isTaskDraft(value: unknown): value is TaskDraft {
  if (!value || typeof value !== "object") return false;
  const task = value as Partial<TaskDraft>;
  return (
    typeof task.project === "string" &&
    typeof task.projectColor === "string" &&
    typeof task.ticket === "string" &&
    typeof task.startTime === "string" &&
    typeof task.durationMinutes === "number" &&
    Number.isFinite(task.durationMinutes) &&
    task.durationMinutes >= 5 &&
    typeof task.type === "string" &&
    typeof task.summary === "string" &&
    (task.workStatus === "SELESAI" ||
      task.workStatus === "BERJALAN" ||
      task.workStatus === "TERTAHAN")
  );
}
