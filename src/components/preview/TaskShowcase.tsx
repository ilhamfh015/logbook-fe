"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TimelinePreview } from "@/components/preview/TimelinePreview";
import { Dialog } from "@/components/shared/Dialog";
import { SidePanel } from "@/components/shared/SidePanel";
import { TaskForm, type TaskFormField } from "@/components/task/TaskForm";
import { ApiError } from "@/services/apiClient";
import { nextStartTime } from "@/lib/taskTime";
import { logger } from "@/lib/logger";
import {
  taskService,
  type DailyLog,
  type ProjectOption,
  type TaskMasterData,
} from "@/services/taskService";
import type { TaskDraft as TaskFormDraft, WorkStatus } from "@/types/task";

const initialMasterData: TaskMasterData = { types: [], statuses: [], durations: [] };

type ConfirmDialogState = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
};

type AlertDialogState = {
  title: string;
  message: string;
};

export function TaskShowcase() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [startTime, setStartTime] = useState("08:00");
  const [savedTasks, setSavedTasks] = useState<TaskFormDraft[]>([]);
  const [editingTask, setEditingTask] = useState<TaskFormDraft | null>(null);
  const [dailyLogId, setDailyLogId] = useState<number | null>(null);
  const [dailyLogStatus, setDailyLogStatus] = useState<string | null>(null);
  const [dailyLogSubmittedAt, setDailyLogSubmittedAt] = useState<string | null>(null);
  const [dailyLogMissing, setDailyLogMissing] = useState(false);
  const [dailyLogLoading, setDailyLogLoading] = useState(true);
  const [submittingDailyLog, setSubmittingDailyLog] = useState(false);
  const [withdrawingDailyLog, setWithdrawingDailyLog] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [masterData, setMasterData] = useState(initialMasterData);
  const [lookupLoading, setLookupLoading] = useState(true);
  const [lookupError, setLookupError] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<TaskFormField, string>>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [alertDialog, setAlertDialog] = useState<AlertDialogState | null>(null);
  const requestId = useRef(0);
  const readOnly = dailyLogStatus === "MENUNGGU";
  const closeConfirmDialog = useCallback(() => setConfirmDialog(null), []);
  const closeAlertDialog = useCallback(() => setAlertDialog(null), []);

  const loadDailyLog = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setDailyLogLoading(true);
    setDailyLogMissing(false);
    setDailyLogId(null);
    setDailyLogStatus(null);
    setDailyLogSubmittedAt(null);
    setSavedTasks([]);
    try {
      const dailyLog = await taskService.getDailyLog(formatDate(selectedDate));
      if (currentRequestId !== requestId.current) return false;
      setDailyLogId(dailyLog.id);
      setDailyLogStatus(dailyLog.status);
      setDailyLogSubmittedAt(dailyLog.submittedAt);
      setSavedTasks(dailyLog.tasks.map((task) => toTaskDraft(task, projects, masterData)));
      return true;
    } catch (error) {
      if (currentRequestId !== requestId.current) return false;
      setDailyLogId(null);
      setDailyLogStatus(null);
      setDailyLogSubmittedAt(null);
      setSavedTasks([]);
      if (error instanceof ApiError && error.status === 404) {
        logger.info("Daily Log belum tersedia", { date: formatDate(selectedDate) });
        setDailyLogMissing(true);
        return false;
      }
      logger.error("Gagal memuat Daily Log", error, { date: formatDate(selectedDate) });
      setNotice(getErrorMessage(error));
      setNoticeIsError(true);
      return false;
    } finally {
      if (currentRequestId === requestId.current) setDailyLogLoading(false);
    }
  }, [masterData, projects, selectedDate]);

  useEffect(() => {
    let active = true;
    Promise.all([taskService.getProjects(), taskService.getMasterData()])
      .then(([availableProjects, availableMasterData]) => {
        if (!active) return;
        setProjects(availableProjects);
        setMasterData(availableMasterData);
        setLookupError("");
      })
      .catch((error: unknown) => {
        if (active) {
          setLookupError(getErrorMessage(error));
          setDailyLogLoading(false);
        }
      })
      .finally(() => {
        if (active) setLookupLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (lookupLoading || lookupError) return;
    let active = true;
    const timer = window.setTimeout(() => {
      if (active) void loadDailyLog();
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadDailyLog, lookupError, lookupLoading]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const openNewTask = async (time?: string) => {
    setNotice("");
    setFormError("");
    setFieldErrors({});
    setEditingTask(null);
    const suggestedStartTime = time ?? nextStartTime(savedTasks);
    setStartTime(suggestedStartTime);
    logger.info("Membuka form task baru", {
      date: formatDate(selectedDate),
      startTime: suggestedStartTime,
      taskCount: savedTasks.length,
    });

    if (readOnly) {
      setNotice("Tarik kembali Daily Log terlebih dahulu untuk mengubahnya.");
      setNoticeIsError(false);
      return;
    }

    if (dailyLogId === null && dailyLogLoading) {
      setNotice("Daily Log sedang dimuat. Coba lagi sebentar.");
      return;
    }

    if (dailyLogId === null && !dailyLogMissing) {
      setNotice("Daily Log belum dapat dimuat. Periksa koneksi lalu coba lagi.");
      setNoticeIsError(true);
      return;
    }

    if (dailyLogId === null && dailyLogMissing) {
      setDailyLogLoading(true);
      try {
        const dailyLog = await taskService.createDailyLog(formatDate(selectedDate));
        setDailyLogId(dailyLog.id);
        setDailyLogStatus(dailyLog.status);
        setDailyLogSubmittedAt(dailyLog.submittedAt);
        setSavedTasks(dailyLog.tasks.map((task) => toTaskDraft(task, projects, masterData)));
        setDailyLogMissing(false);
        logger.info("Daily Log dibuat", { date: formatDate(selectedDate), dailyLogId: dailyLog.id });
      } catch (error) {
        setNotice(getErrorMessage(error));
        setNoticeIsError(true);
        return;
      } finally {
        setDailyLogLoading(false);
      }
    }

    setPanelOpen(true);
  };

  const saveTask = async (task: TaskFormDraft) => {
    const mode = task.id ? "update" : "create";
    if (readOnly) {
      setFormError("Tarik kembali Daily Log terlebih dahulu untuk mengubahnya.");
      return;
    }

    if (dailyLogId === null) {
      setFormError("Daily Log untuk tanggal ini belum tersedia. Task belum dapat disimpan.");
      return;
    }

    setSaving(true);
    setFormError("");
    setFieldErrors({});
    try {
      const taskId = task.id ? Number(task.id) : null;
      if (taskId !== null) {
        if (!Number.isSafeInteger(taskId)) throw new Error("ID task tidak valid; perubahan tidak dapat disimpan.");
        await taskService.update(taskId, task);
      } else {
        await taskService.create(dailyLogId, task);
      }
      setPanelOpen(false);
      setEditingTask(null);
      const refreshed = await loadDailyLog();
      setNotice(refreshed ? (task.id ? "Task diperbarui." : "Task ditambahkan.") : "Task tersimpan, tetapi kalender belum dapat dimuat ulang.");
      setNoticeIsError(!refreshed);
      logger.info(mode === "update" ? "Task diperbarui" : "Task ditambahkan", {
        mode,
        taskId: task.id ?? "-",
        dailyLogId,
        startTime: task.startTime,
        durationMinutes: task.durationMinutes,
        projectId: task.projectId ?? "-",
      });
    } catch (error) {
      const validation = getFieldErrors(error);
      const hasFieldErrors = Object.keys(validation.fields).length > 0;
      logger.error("Gagal menyimpan task", error, {
        mode,
        taskId: task.id ?? "-",
        dailyLogId,
        fieldCount: Object.keys(validation.fields).length,
      });
      setFieldErrors(validation.fields);
      setFormError(hasFieldErrors ? "" : validation.message);
      setAlertDialog({
        title: error instanceof ApiError && error.status === 400
          ? "Periksa kembali data task"
          : "Task belum dapat disimpan",
        message: validation.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const performDeleteTask = async (taskId: number) => {
    try {
      await taskService.delete(taskId);
      const refreshed = await loadDailyLog();
      setNotice(refreshed ? "Task dihapus." : "Task dihapus, tetapi kalender belum dapat dimuat ulang.");
      setNoticeIsError(!refreshed);
      logger.info("Task dihapus", { taskId });
    } catch (error) {
      logger.error("Gagal menghapus task", error, { taskId });
      setNotice(getErrorMessage(error));
      setNoticeIsError(true);
    }
  };

  const deleteTask = (id: string) => {
    if (readOnly) {
      setNotice("Tarik kembali Daily Log terlebih dahulu untuk mengubahnya.");
      setNoticeIsError(false);
      return;
    }

    const taskId = Number(id);
    if (!Number.isSafeInteger(taskId)) {
      logger.warn("ID task tidak valid untuk dihapus", { taskId: id });
      setNotice("ID task tidak valid; task tidak dapat dihapus.");
      setNoticeIsError(true);
      return;
    }

    setConfirmDialog({
      title: "Hapus task?",
      description: "Task ini akan dihapus permanen dan tidak dapat dikembalikan.",
      confirmLabel: "Hapus task",
      tone: "danger",
      onConfirm: () => {
        setConfirmDialog(null);
        void performDeleteTask(taskId);
      },
    });
  };

  const performSubmitDailyLog = async (id: number) => {
    setSubmittingDailyLog(true);
    setNotice("");
    try {
      const updated = await taskService.submitDailyLog(id);
      setDailyLogStatus(updated.status);
      setDailyLogSubmittedAt(updated.submittedAt);
      setSavedTasks(updated.tasks.map((task) => toTaskDraft(task, projects, masterData)));
      setNotice("Daily Log berhasil dikirim.");
      setNoticeIsError(false);
      logger.info("Daily Log dikirim", { dailyLogId: id, status: updated.status, taskCount: updated.tasks.length });
    } catch (error) {
      logger.error("Gagal mengirim Daily Log", error, { dailyLogId: id });
      setNotice(getErrorMessage(error));
      setNoticeIsError(true);
    } finally {
      setSubmittingDailyLog(false);
    }
  };

  const submitDailyLog = () => {
    if (readOnly || dailyLogId === null || savedTasks.length === 0 || submittingDailyLog) {
      return;
    }

    const id = dailyLogId;
    setConfirmDialog({
      title: "Kirim Daily Log?",
      description: "Setelah dikirim, task tidak dapat diubah lagi sampai Daily Log ditarik kembali.",
      confirmLabel: "Kirim Daily Log",
      onConfirm: () => {
        setConfirmDialog(null);
        void performSubmitDailyLog(id);
      },
    });
  };

  const performWithdrawDailyLog = async (id: number) => {
    setWithdrawingDailyLog(true);
    setNotice("");
    try {
      const updated = await taskService.withdrawDailyLog(id);
      setDailyLogStatus(updated.status);
      setDailyLogSubmittedAt(updated.submittedAt);
      setSavedTasks(updated.tasks.map((task) => toTaskDraft(task, projects, masterData)));
      setNotice("Daily Log ditarik kembali menjadi Draf.");
      setNoticeIsError(false);
      logger.info("Daily Log ditarik kembali", { dailyLogId: id, status: updated.status });
    } catch (error) {
      logger.error("Gagal menarik kembali Daily Log", error, { dailyLogId: id });
      setNotice(getErrorMessage(error));
      setNoticeIsError(true);
    } finally {
      setWithdrawingDailyLog(false);
    }
  };

  const withdrawDailyLog = () => {
    if (!readOnly || dailyLogId === null || withdrawingDailyLog) {
      return;
    }

    const id = dailyLogId;
    setConfirmDialog({
      title: "Tarik kembali Daily Log?",
      description: "Status Daily Log akan kembali menjadi Draf dan task dapat diubah lagi.",
      confirmLabel: "Tarik Kembali",
      onConfirm: () => {
        setConfirmDialog(null);
        void performWithdrawDailyLog(id);
      },
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] min-w-0 pb-24 md:pb-0">
      <TimelinePreview
        date={selectedDate}
        onChangeDate={setSelectedDate}
        onAddTask={(time) => openNewTask(time)}
        savedTasks={savedTasks}
        onEditTask={(task) => {
          if (readOnly) return;
          setNotice("");
          setFormError("");
          setFieldErrors({});
          setEditingTask(task);
          setPanelOpen(true);
          logger.info("Membuka form edit task", { taskId: task.id ?? "-", startTime: task.startTime });
        }}
        onDeleteTask={deleteTask}
        loading={dailyLogLoading}
        emptyMessage={dailyLogMissing ? "Daily Log untuk tanggal ini belum tersedia." : ""}
        status={dailyLogStatus}
        submittedAt={dailyLogSubmittedAt}
        readOnly={readOnly}
        canSubmit={savedTasks.length > 0}
        submitting={submittingDailyLog}
        onSubmit={submitDailyLog}
        withdrawing={withdrawingDailyLog}
        onWithdraw={withdrawDailyLog}
      />
      <SidePanel
        title={editingTask ? "Edit Task" : "Tambah Task"}
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setEditingTask(null); }}
      >
        {dailyLogMissing ? <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" role="status">Daily Log untuk tanggal ini belum tersedia. Setelah Daily Log dibuat, task dapat ditambahkan.</p> : null}
        {lookupError ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{lookupError}</p> : null}
        <TaskForm
          key={editingTask?.id ?? `new-task-${startTime}`}
          initialTask={editingTask}
          initialStartTime={startTime}
          onCancel={() => { setPanelOpen(false); setEditingTask(null); }}
          onSave={saveTask}
          onFieldChange={(field) => setFieldErrors((current) => {
            const next = { ...current };
            delete next[field];
            return next;
          })}
          projects={projects}
          taskTypes={masterData.types}
          workStatuses={masterData.statuses}
          durations={masterData.durations}
          loading={lookupLoading || dailyLogLoading}
          blocked={dailyLogMissing}
          saving={saving}
          formError={formError}
          fieldErrors={fieldErrors}
        />
      </SidePanel>
      {!panelOpen ? <button type="button" onClick={() => openNewTask()} className="fixed bottom-24 right-4 z-10 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 md:bottom-6 md:right-6">+ Tambah task</button> : null}
      {notice ? <div role={noticeIsError ? "alert" : "status"} className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg md:bottom-6 ${noticeIsError ? "bg-red-700" : "bg-slate-900"}`}>{notice}</div> : null}
      <Dialog
        open={confirmDialog !== null}
        title={confirmDialog?.title ?? ""}
        confirmLabel={confirmDialog?.confirmLabel ?? ""}
        cancelLabel="Batal"
        tone={confirmDialog?.tone}
        onConfirm={() => confirmDialog?.onConfirm()}
        onCancel={closeConfirmDialog}
      >
        {confirmDialog?.description}
      </Dialog>
      <Dialog
        open={alertDialog !== null}
        title={alertDialog?.title ?? ""}
        confirmLabel="Mengerti"
        onConfirm={closeAlertDialog}
        onCancel={closeAlertDialog}
      >
        {alertDialog?.message}
      </Dialog>
    </div>
  );
}

function toTaskDraft(task: DailyLog["tasks"][number], projects: ProjectOption[], masterData: TaskMasterData): TaskFormDraft {
  const project = projects.find((item) => item.project_id === task.projectId);
  const workStatus = masterData.statuses.find((item) => item.id === task.workStatusId);
  const taskType = masterData.types.find((item) => item.id === task.taskTypeId);
  return {
    id: String(task.id),
    projectId: task.projectId,
    taskTypeId: task.taskTypeId,
    workStatusId: task.workStatusId,
    project: project?.project_name ?? `Proyek #${task.projectId}`,
    projectColor: project?.color ?? "blue",
    ticket: task.ticket ?? "",
    startTime: task.startTime.slice(0, 5),
    durationMinutes: task.durationMinutes,
    type: taskType?.name ?? `Jenis task #${task.taskTypeId}`,
    summary: task.summary,
    obstacle: task.obstacle ?? "",
    workStatus: workStatus ? toWorkStatus(workStatus.name) : "BERJALAN",
  };
}

function toWorkStatus(name: string): WorkStatus {
  const normalized = name.toLowerCase();
  if (normalized.includes("selesai") || normalized.includes("complete")) return "SELESAI";
  if (normalized.includes("tertahan") || normalized.includes("blocked") || normalized.includes("hold")) return "TERTAHAN";
  return "BERJALAN";
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan saat menghubungi server.";
}

const apiFieldMap: Record<string, TaskFormField> = {
  projectId: "project",
  taskTypeId: "type",
  workStatusId: "status",
  startTime: "startTime",
  durationMinutes: "duration",
  summary: "summary",
  ticket: "ticket",
};

function getFieldErrors(error: unknown) {
  const message = getErrorMessage(error);
  const normalized = message.toLowerCase();
  const fields: Partial<Record<TaskFormField, string>> = {};

  if (error instanceof ApiError) {
    for (const [field, fieldMessage] of Object.entries(error.fieldErrors)) {
      const mappedField = apiFieldMap[field];
      if (mappedField) fields[mappedField] = fieldMessage;
    }
  }

  const map: Array<[TaskFormField, string[]]> = [
    ["project", ["project", "proyek"]],
    ["ticket", ["ticket", "tiket"]],
    ["startTime", ["start time", "jam mulai", "waktu mulai"]],
    ["duration", ["duration", "durasi"]],
    ["type", ["task type", "jenis task"]],
    ["summary", ["summary", "ringkasan"]],
    ["status", ["work status", "status pekerjaan"]],
  ];
  for (const [field, markers] of map) {
    if (!fields[field] && markers.some((marker) => normalized.includes(marker))) {
      fields[field] = message;
    }
  }

  const firstFieldMessage = Object.values(fields).find(Boolean);
  return { fields, message: firstFieldMessage ?? message };
}
