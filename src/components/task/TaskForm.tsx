"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ProjectChip } from "@/components/shared/ProjectChip";
import { StatusSegmented } from "@/components/shared/StatusSegmented";
import { TaskTypePill } from "@/components/shared/TaskTypePill";
import { logger } from "@/lib/logger";
import type {
  DurationOption,
  ProjectOption,
  TaskTypeOption,
  WorkStatusOption,
} from "@/services/taskService";
import type { TaskDraft, WorkStatus } from "@/types/task";

export type TaskFormField = "project" | "ticket" | "startTime" | "duration" | "type" | "summary" | "status";
type TaskFormProps = {
  onCancel: () => void;
  onSave: (task: TaskDraft) => Promise<void>;
  initialTask?: TaskDraft | null;
  initialStartTime?: string;
  projects: ProjectOption[];
  taskTypes: TaskTypeOption[];
  workStatuses: WorkStatusOption[];
  durations: DurationOption[];
  loading: boolean;
  blocked?: boolean;
  saving: boolean;
  formError?: string;
  fieldErrors?: Partial<Record<TaskFormField, string>>;
};

const defaultDurations: DurationOption[] = [
  { minutes: 15, label: "15 m" },
  { minutes: 30, label: "30 m" },
  { minutes: 60, label: "1 j" },
  { minutes: 90, label: "1,5 j" },
  { minutes: 120, label: "2 j" },
];

export function TaskForm({
  onCancel,
  onSave,
  initialTask,
  initialStartTime,
  projects,
  taskTypes,
  workStatuses,
  durations,
  loading,
  blocked = false,
  saving,
  formError,
  fieldErrors = {},
}: TaskFormProps) {
  const [projectId, setProjectId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [status, setStatus] = useState<WorkStatus>(initialTask?.workStatus ?? "BERJALAN");
  const [duration, setDuration] = useState("");
  const [customDuration, setCustomDuration] = useState(String(initialTask?.durationMinutes ?? 30));
  const [summary, setSummary] = useState(initialTask?.summary ?? "");
  const [obstacle, setObstacle] = useState(initialTask?.obstacle ?? "");
  const [localErrors, setLocalErrors] = useState<Partial<Record<TaskFormField, string>>>({});
  const selectedProjectId = projectId || (initialTask?.projectId ? String(initialTask.projectId) : String(projects[0]?.project_id ?? ""));
  const selectedTypeId = typeId || (initialTask?.taskTypeId ? String(initialTask.taskTypeId) : String(taskTypes[0]?.id ?? ""));
  const selectedDuration = duration || (
    initialTask
      ? durations.some((item) => item.minutes === initialTask.durationMinutes) ? String(initialTask.durationMinutes) : "other"
      : String(durations[0]?.minutes ?? 60)
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const selectedProject = projects.find((item) => String(item.project_id) === selectedProjectId);
    const selectedType = taskTypes.find((item) => String(item.id) === selectedTypeId);
    const selectedStatus = workStatuses.find((item) => statusForOption(item) === status);
    const durationMinutes = selectedDuration === "other" ? Number(customDuration) : Number(selectedDuration);

    const errors: Partial<Record<TaskFormField, string>> = {};
    if (!selectedProject) errors.project = "Pilih proyek yang tersedia.";
    if (!selectedType) errors.type = "Pilih jenis task yang tersedia.";
    if (!selectedStatus) errors.status = "Status pekerjaan tidak tersedia dari server.";
    if (!Number.isFinite(durationMinutes) || durationMinutes < 5 || durationMinutes > 1440) {
      errors.duration = "Durasi harus antara 5 dan 1440 menit.";
    }
    if (
      !selectedProject
      || !selectedType
      || !selectedStatus
      || !Number.isFinite(durationMinutes)
      || durationMinutes < 5
      || durationMinutes > 1440
    ) {
      setLocalErrors(errors);
      return;
    }
    setLocalErrors({});

    await onSave({
      id: initialTask?.id,
      projectId: selectedProject.project_id,
      taskTypeId: selectedType.id,
      workStatusId: selectedStatus.id,
      project: selectedProject.project_name,
      projectColor: selectedProject.color || "blue",
      ticket: String(formData.get("ticket") ?? "").trim(),
      startTime: String(formData.get("startTime") ?? ""),
      durationMinutes,
      type: selectedType.name,
      summary: summary.trim(),
      obstacle: obstacle.trim(),
      workStatus: status,
    });
  };

  const showError = (field: TaskFormField) => {
    const message = fieldErrors[field] ?? localErrors[field];
    return message ? <p className="mt-1 text-xs font-medium text-red-600" role="alert">{message}</p> : null;
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {formError ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{formError}</p> : null}
      {loading ? <p className="text-sm text-slate-500" role="status">Memuat pilihan task...</p> : null}

      <fieldset disabled={loading || blocked || saving} className="disabled:opacity-70">
        <legend className="mb-2 text-sm font-semibold text-ink">Proyek <span className="text-brand">*</span></legend>
        <div className="flex flex-wrap gap-2">
          {projects.map((item) => (
            <ProjectChip
              key={item.project_id}
              name={item.project_name}
              color={projectChipColor(item)}
              selected={selectedProjectId === String(item.project_id)}
              onClick={() => setProjectId(String(item.project_id))}
            />
          ))}
        </div>
        {projects.length === 0 && !loading ? <p className="mt-2 text-sm text-slate-500">Belum ada proyek yang tersedia.</p> : null}
        {showError("project")}
      </fieldset>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <label className="col-span-2 sm:col-span-1">
          <span className="mb-2 block text-sm font-semibold">Tiket <span className="font-normal text-slate-400">(opsional)</span></span>
          <input name="ticket" className="field-control" placeholder="ABC-153" defaultValue={initialTask?.ticket} aria-invalid={Boolean(fieldErrors.ticket)} />
          {showError("ticket")}
        </label>
        <label>
          <span className="mb-2 block text-sm font-semibold">Mulai <span className="text-brand">*</span></span>
          <input name="startTime" className="field-control" type="time" defaultValue={initialTask?.startTime ?? initialStartTime ?? "16:00"} required aria-invalid={Boolean(fieldErrors.startTime)} />
          {showError("startTime")}
        </label>
        <label>
          <span className="mb-2 block text-sm font-semibold">Durasi <span className="text-brand">*</span></span>
          <select name="duration" className="field-control" value={selectedDuration} onChange={(event) => setDuration(event.target.value)} aria-invalid={Boolean(fieldErrors.duration)}>
            {(durations.length ? durations : defaultDurations).map((item) => <option key={item.minutes} value={item.minutes}>{item.label}</option>)}
            <option value="other">Lainnya</option>
          </select>
          {showError("duration")}
        </label>
      </div>
      {selectedDuration === "other" ? (
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Durasi (menit)</span>
          <input className="field-control max-w-40" type="number" min="5" max="1440" step="5" value={customDuration} onChange={(event) => setCustomDuration(event.target.value)} required aria-invalid={Boolean(fieldErrors.duration)} />
          {showError("duration")}
        </label>
      ) : null}

      <fieldset disabled={loading || blocked || saving}>
        <legend className="mb-2 text-sm font-semibold">Jenis task <span className="text-brand">*</span></legend>
        <div className="flex flex-wrap gap-2">
          {taskTypes.map((item) => (
            <TaskTypePill key={item.id} type={item.name} selected={selectedTypeId === String(item.id)} onClick={() => setTypeId(String(item.id))} />
          ))}
        </div>
        {showError("type")}
      </fieldset>

      <div>
        <label htmlFor="task-summary" className="mb-2 block text-sm font-semibold">Ringkasan dan hasil <span className="text-brand">*</span></label>
        <div className="relative">
          <textarea id="task-summary" name="summary" className="field-control min-h-24 resize-y pb-7" placeholder="Apa yang dikerjakan, hasilnya, buktinya." maxLength={500} value={summary} onChange={(event) => setSummary(event.target.value)} required aria-invalid={Boolean(fieldErrors.summary)} />
          <span className="absolute bottom-2 right-3 text-xs text-slate-400">{summary.length}/500</span>
        </div>
        {showError("summary")}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-semibold text-slate-600">Tulis: apa · hasil · bukti</span><Link href="/contoh" onClick={() => logger.info("Membuka contoh log book", { source: "form-task" })} className="font-medium text-brand underline-offset-2 hover:underline">Lihat contoh</Link></div>
      </div>

      <div>
        <label htmlFor="task-obstacle" className="mb-2 block text-sm font-semibold">Kendala <span className="font-normal text-slate-400">(opsional)</span></label>
        <textarea
          id="task-obstacle"
          className="field-control min-h-20 resize-y"
          value={obstacle}
          onChange={(event) => setObstacle(event.target.value)}
          placeholder="Catat kendala dan solusinya jika ada."
          disabled={loading || blocked || saving}
        />
      </div>

      <fieldset disabled={loading || blocked || saving}>
        <legend className="mb-2 text-sm font-semibold">Status <span className="text-brand">*</span></legend>
        <StatusSegmented value={status} onChange={setStatus} />
        {showError("status")}
      </fieldset>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onCancel} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Batal</button>
        <button type="submit" disabled={loading || blocked || saving || projects.length === 0 || taskTypes.length === 0 || workStatuses.length === 0} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">{saving ? "Menyimpan..." : "Simpan task"}</button>
      </div>
    </form>
  );
}

function statusForOption(option: WorkStatusOption): WorkStatus | undefined {
  const name = option.name.toLowerCase();
  if (name.includes("selesai") || name.includes("complete")) return "SELESAI";
  if (name.includes("berjalan") || name.includes("progress") || name.includes("ongoing")) return "BERJALAN";
  if (name.includes("tertahan") || name.includes("blocked") || name.includes("hold")) return "TERTAHAN";
  return undefined;
}

function projectChipColor(project: ProjectOption) {
  const projectLabel = `${project.client_name} ${project.project_name} ${project.color}`.toLowerCase();
  return projectLabel.includes("asuransi") || projectLabel.includes("orange") ? "orange" : "blue";
}
