"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ErrorNotice } from "@/components/shared/ErrorNotice";
import { ProjectChip } from "@/components/shared/ProjectChip";
import { StatusSegmented } from "@/components/shared/StatusSegmented";
import { TaskTypePill } from "@/components/shared/TaskTypePill";
import {
  firstFieldWithError,
  itemsFromFieldErrors,
  mergeErrorItems,
  orderErrorItems,
  type ErrorItem,
} from "@/lib/errorItems";
import { logger } from "@/lib/logger";
import { toMinutes } from "@/lib/taskTime";
import type {
  ContinueTask,
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
  onFieldChange?: (field: TaskFormField) => void;
  initialTask?: TaskDraft | null;
  initialStartTime?: string;
  continueTasks?: ContinueTask[];
  projects: ProjectOption[];
  taskTypes: TaskTypeOption[];
  workStatuses: WorkStatusOption[];
  durations: DurationOption[];
  loading: boolean;
  blocked?: boolean;
  saving: boolean;
  formError?: string;
  fieldErrors?: Partial<Record<TaskFormField, string>>;
  serverErrorItems?: ErrorItem[];
  onSubmitAttempt?: () => void;
};

const fieldOrder: TaskFormField[] = ["project", "ticket", "startTime", "duration", "type", "summary", "status"];
const fieldLabels: Record<TaskFormField, string> = {
  project: "Proyek",
  ticket: "Tiket",
  startTime: "Mulai",
  duration: "Durasi",
  type: "Jenis task",
  summary: "Ringkasan",
  status: "Status",
};
const apiFieldMap: Record<string, TaskFormField> = {
  projectId: "project",
  ticket: "ticket",
  startTime: "startTime",
  durationMinutes: "duration",
  taskTypeId: "type",
  summary: "summary",
  workStatusId: "status",
};
const fieldElementIds: Record<TaskFormField, string> = {
  project: "task-project-field",
  ticket: "task-ticket",
  startTime: "task-start-time",
  duration: "task-duration",
  type: "task-type-field",
  summary: "task-summary",
  status: "task-status-field",
};
const fieldErrorIds: Record<TaskFormField, string> = {
  project: "task-error-project",
  ticket: "task-error-ticket",
  startTime: "task-error-start-time",
  duration: "task-error-duration",
  type: "task-error-type",
  summary: "task-error-summary-field",
  status: "task-error-status",
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
  onFieldChange,
  initialTask,
  initialStartTime,
  continueTasks = [],
  projects,
  taskTypes,
  workStatuses,
  durations,
  loading,
  blocked = false,
  saving,
  formError,
  fieldErrors = {},
  serverErrorItems = [],
  onSubmitAttempt,
}: TaskFormProps) {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [dismissedGeneralSignature, setDismissedGeneralSignature] = useState("");
  const previousServerErrorSignature = useRef("");
  const [projectId, setProjectId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [status, setStatus] = useState<WorkStatus>(initialTask?.workStatus ?? "BERJALAN");
  const [duration, setDuration] = useState<string | null>(null);
  const [customDuration, setCustomDuration] = useState(String(initialTask?.durationMinutes ?? 30));
  const [summary, setSummary] = useState(initialTask?.summary ?? "");
  const [obstacle, setObstacle] = useState(initialTask?.obstacle ?? "");
  const [ticket, setTicket] = useState(initialTask?.ticket ?? "");
  const [startTime, setStartTime] = useState((initialTask?.startTime ?? initialStartTime ?? "08:00").slice(0, 5));
  const selectedProjectId = projectId || (initialTask?.projectId ? String(initialTask.projectId) : "");
  const selectedTypeId = typeId || (initialTask?.taskTypeId ? String(initialTask.taskTypeId) : "");
  const selectedDuration = duration ?? (
    initialTask
      ? durations.some((item) => item.minutes === initialTask.durationMinutes) ? String(initialTask.durationMinutes) : "other"
      : ""
  );

  const selectedProject = projects.find((item) => String(item.project_id) === selectedProjectId);
  const selectedType = taskTypes.find((item) => String(item.id) === selectedTypeId);
  const selectedStatus = workStatuses.find((item) => statusForOption(item) === status);
  const durationMinutes = selectedDuration === "other"
    ? Number(customDuration)
    : selectedDuration ? Number(selectedDuration) : Number.NaN;
  const startMinutes = toMinutes(startTime);
  const outsideWorkHours = Number.isFinite(startMinutes) && (
    startMinutes < 8 * 60
    || startMinutes >= 17 * 60
    || (Number.isFinite(durationMinutes) && startMinutes + durationMinutes > 17 * 60)
  );

  const validationErrors = loading
    ? {}
    : validateForm({
        projectSelected: Boolean(selectedProject),
        typeSelected: Boolean(selectedType),
        statusSelected: Boolean(selectedStatus),
        ticket,
        startTime,
        summary,
        durationSelection: selectedDuration,
        customDuration,
      });

  const localErrorItems = itemsFromFieldErrors(validationErrors, "form").map((item) => ({
    ...item,
    id: `local-${item.id}`,
    message: `${fieldLabels[item.field as TaskFormField]}: ${item.message}`,
  }));
  const propFieldErrorItems = itemsFromFieldErrors(
    Object.fromEntries(Object.entries(fieldErrors)),
    "server",
  ).map((item) => withFieldLabel(
    { ...item, id: `prop-${item.id}` },
    item.field ? normalizeFormField(item.field) : undefined,
  ));
  const passedServerErrorItems = serverErrorItems.map((item) => {
    const field = item.field ? normalizeFormField(item.field) : undefined;
    return withFieldLabel({ ...item, id: `server-${item.id}` }, field);
  });
  const externalErrorItems = orderErrorItems(
    mergeErrorItems(
      propFieldErrorItems,
      passedServerErrorItems,
      formError ? [{ id: "error-form", message: formError, source: "server" }] : [],
    ),
    fieldOrder,
  );
  const generalErrorSignature = JSON.stringify(
    externalErrorItems.filter((item) => !item.field).map((item) => [item.id, item.message]),
  );
  const generalErrorsDismissed = generalErrorSignature !== "[]"
    && dismissedGeneralSignature === generalErrorSignature;
  const visibleExternalItems = generalErrorsDismissed
    ? externalErrorItems.filter((item) => item.field)
    : externalErrorItems;
  const showSummary = hasSubmitted || externalErrorItems.length > 0;
  const summaryItems = showSummary
    ? orderErrorItems(mergeErrorItems(localErrorItems, visibleExternalItems), fieldOrder)
    : [];

  const focusField = (field: string) => {
    document.getElementById(fieldElementIds[normalizeFormField(field) ?? "project"])?.focus();
  };
  const focusFirstError = (items: ErrorItem[]) => {
    const firstField = firstFieldWithError(items, fieldOrder);
    if (firstField) focusField(firstField);
    else document.getElementById("task-error-summary")?.focus();
  };

  const serverErrorSignature = JSON.stringify(externalErrorItems);
  const firstServerErrorField = firstFieldWithError(summaryItems, fieldOrder) as TaskFormField | null;
  const serverErrorFocusTarget: TaskFormField | "summary" | null = externalErrorItems.length > 0
    ? firstServerErrorField ?? "summary"
    : null;
  useEffect(() => {
    if (serverErrorSignature === previousServerErrorSignature.current) return;
    previousServerErrorSignature.current = serverErrorSignature;
    if (!serverErrorFocusTarget) return;
    const elementId = serverErrorFocusTarget === "summary"
      ? "task-error-summary"
      : fieldElementIds[serverErrorFocusTarget];
    document.getElementById(elementId)?.focus();
  }, [serverErrorFocusTarget, serverErrorSignature]);

  const notifyFieldChange = (field: TaskFormField) => {
    onFieldChange?.(field);
    if (generalErrorSignature !== "[]") setDismissedGeneralSignature(generalErrorSignature);
  };

  // Saran ini hanya relevan saat menambah task baru; saat mengubah task, isi
  // form sudah berasal dari task yang dipilih.
  const continueSuggestions = initialTask
    ? []
    : buildContinueSuggestions(continueTasks, projects, taskTypes);

  const applyContinueSuggestion = (suggestion: ContinueSuggestion) => {
    if (suggestion.project) {
      setProjectId(String(suggestion.project.project_id));
      notifyFieldChange("project");
    }
    if (suggestion.type) {
      setTypeId(String(suggestion.type.id));
      notifyFieldChange("type");
    }
    if (suggestion.ticket) {
      setTicket(suggestion.ticket);
      notifyFieldChange("ticket");
    }
    logger.info("Melanjutkan task dari hari sebelumnya", {
      ticket: suggestion.ticket,
      project: suggestion.project?.project_name,
      type: suggestion.type?.name,
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSubmitted(true);
    onSubmitAttempt?.();
    setDismissedGeneralSignature("");
    const errors = validateForm({
      projectSelected: Boolean(selectedProject),
      typeSelected: Boolean(selectedType),
      statusSelected: Boolean(selectedStatus),
      ticket,
      startTime,
      summary,
      durationSelection: selectedDuration,
      customDuration,
    });

    if (
      !selectedProject
      || !selectedType
      || !selectedStatus
      || Object.keys(errors).length > 0
      || !Number.isFinite(durationMinutes)
      || durationMinutes < 5
      || durationMinutes > 1440
    ) {
      logger.warn("Validasi form task gagal", {
        fields: Object.keys(errors).join(",") || "task",
      });
      for (const field of Object.keys(errors) as TaskFormField[]) notifyFieldChange(field);
      const currentLocalItems = itemsFromFieldErrors(errors, "form").map((item) => ({
        ...item,
        message: `${fieldLabels[item.field as TaskFormField]}: ${item.message}`,
      }));
      focusFirstError(orderErrorItems(mergeErrorItems(currentLocalItems, visibleExternalItems), fieldOrder));
      return;
    }

    await onSave({
      id: initialTask?.id,
      projectId: selectedProject.project_id,
      taskTypeId: selectedType.id,
      workStatusId: selectedStatus.id,
      project: selectedProject.project_name,
      projectColor: selectedProject.color || "blue",
      ticket: ticket.trim(),
      startTime,
      durationMinutes,
      type: selectedType.name,
      summary: summary.trim(),
      obstacle: obstacle.trim(),
      workStatus: status,
    });
  };

  const showError = (field: TaskFormField) => {
    const message = fieldErrors[field] ?? validationErrors[field];
    const externalHasError = visibleExternalItems.some((item) => item.field === field);
    if (!message && !externalHasError) return null;
    return (
      <p id={fieldErrorIds[field]} className="mt-1 text-xs font-medium text-red-600" role="status">
        {showSummary ? (
          <>
            Perlu diperbaiki.<span className="sr-only">{message}</span>
          </>
        ) : message}
      </p>
    );
  };

  const hasError = (field: TaskFormField) => Boolean(
    fieldErrors[field] ?? validationErrors[field] ?? visibleExternalItems.some((item) => item.field === field),
  );

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {continueSuggestions.length > 0 ? (
        <section aria-label="Lanjutkan pekerjaan" className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
          {continueSuggestions.map((suggestion) => {
            const label = suggestion.ticket || suggestion.project?.project_name || "task sebelumnya";
            const summary = suggestion.summary.replace(/[.!?\s]+$/, "");
            return (
              <div key={suggestion.key} className="flex flex-wrap items-center justify-between gap-3">
                <p className="min-w-0 flex-1 text-sm text-slate-700">
                  Lanjutkan <span className="font-semibold text-ink">{label}</span>
                  {summary ? (
                    <>
                      {" "}
                      <span className="text-slate-600 line-clamp-2">{summary}</span>
                    </>
                  ) : null}?
                </p>
                <button
                  type="button"
                  onClick={() => applyContinueSuggestion(suggestion)}
                  disabled={loading || blocked || saving}
                  aria-label={`Lanjutkan ${label}`}
                  className="rounded-lg border border-brand/30 bg-white px-3 py-1.5 text-xs font-semibold text-brand hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  Lanjutkan
                </button>
              </div>
            );
          })}
        </section>
      ) : null}
      {summaryItems.length > 0 ? (
        <ErrorNotice
          id="task-error-summary"
          items={summaryItems}
          onSelectField={focusField}
        />
      ) : null}
      {loading ? <p className="text-sm text-slate-500" role="status">Memuat pilihan task...</p> : null}

      <fieldset id={fieldElementIds.project} tabIndex={-1} disabled={loading || blocked || saving} aria-invalid={hasError("project")} aria-describedby={hasError("project") ? fieldErrorIds.project : undefined} className={`disabled:opacity-70 ${hasError("project") ? "rounded-lg border border-red-500 p-3" : ""}`}>
        <legend className="mb-2 text-sm font-semibold text-ink">Proyek <span className="text-brand">*</span></legend>
        <div className="flex flex-wrap gap-2">
          {projects.map((item) => (
            <ProjectChip
              key={item.project_id}
              name={item.project_name}
              color={projectChipColor(item)}
              selected={selectedProjectId === String(item.project_id)}
              onClick={() => { setProjectId(String(item.project_id)); notifyFieldChange("project"); }}
            />
          ))}
        </div>
        {projects.length === 0 && !loading ? <p className="mt-2 text-sm text-slate-500">Belum ada proyek yang tersedia.</p> : null}
        {showError("project")}
      </fieldset>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <label className="col-span-2 sm:col-span-1">
          <span className="mb-2 block text-sm font-semibold">Tiket <span className="font-normal text-slate-400">(opsional)</span></span>
          <input id={fieldElementIds.ticket} name="ticket" className={`field-control ${hasError("ticket") ? "border-red-500 focus:border-red-600 focus:ring-red-100" : ""}`} placeholder="ABC-153" value={ticket} aria-invalid={hasError("ticket")} aria-describedby={hasError("ticket") ? fieldErrorIds.ticket : undefined} onChange={(event) => { setTicket(event.currentTarget.value); notifyFieldChange("ticket"); }} />
          {showError("ticket")}
        </label>
        <label>
          <span className="mb-2 block text-sm font-semibold">Mulai <span className="text-brand">*</span></span>
          <input id={fieldElementIds.startTime} name="startTime" className={`field-control ${hasError("startTime") ? "border-red-500 focus:border-red-600 focus:ring-red-100" : ""}`} type="time" value={startTime} required aria-invalid={hasError("startTime")} aria-describedby={hasError("startTime") ? fieldErrorIds.startTime : undefined} onChange={(event) => { setStartTime(event.currentTarget.value); notifyFieldChange("startTime"); }} />
          {showError("startTime")}
        </label>
        <label>
          <span className="mb-2 block text-sm font-semibold">Durasi <span className="text-brand">*</span></span>
          <select id={fieldElementIds.duration} name="duration" className={`field-control ${hasError("duration") ? "border-red-500 focus:border-red-600 focus:ring-red-100" : ""}`} value={selectedDuration} onChange={(event) => { setDuration(event.target.value); notifyFieldChange("duration"); }} aria-invalid={hasError("duration")} aria-describedby={hasError("duration") ? fieldErrorIds.duration : undefined}>
            <option value="">Pilih durasi</option>
            {(durations.length ? durations : defaultDurations).map((item) => <option key={item.minutes} value={item.minutes}>{item.label}</option>)}
            <option value="other">Lainnya</option>
          </select>
          {showError("duration")}
        </label>
      </div>
      {outsideWorkHours ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" role="status">
          Peringatan: Waktu task berada di luar jam kerja normal (08.00–17.00). Task tetap bisa disimpan dan akan ditampilkan pada baris jam yang sesuai.
        </p>
      ) : null}
      {selectedDuration === "other" ? (
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Durasi (menit)</span>
          <input id="task-duration-custom" className={`field-control max-w-40 ${hasError("duration") ? "border-red-500 focus:border-red-600 focus:ring-red-100" : ""}`} type="number" min="5" max="1440" step="5" value={customDuration} onChange={(event) => { setCustomDuration(event.target.value); notifyFieldChange("duration"); }} required aria-invalid={hasError("duration")} aria-describedby={hasError("duration") ? fieldErrorIds.duration : undefined} />
          {showError("duration")}
        </label>
      ) : null}

      <fieldset
        disabled={loading || blocked || saving}
        aria-invalid={hasError("type")}
        id={fieldElementIds.type}
        tabIndex={-1}
        aria-describedby={hasError("type") ? fieldErrorIds.type : undefined}
        className={`disabled:opacity-70 ${hasError("type") ? "rounded-lg border border-red-500 p-3" : ""}`}
      >
        <legend className="mb-2 text-sm font-semibold">Jenis task <span className="text-brand">*</span></legend>
        <div className="flex flex-wrap gap-2">
          {taskTypes.map((item) => (
            <TaskTypePill key={item.id} type={item.name} selected={selectedTypeId === String(item.id)} onClick={() => { setTypeId(String(item.id)); notifyFieldChange("type"); }} />
          ))}
        </div>
        {showError("type")}
      </fieldset>

      <div>
        <label htmlFor="task-summary" className="mb-2 block text-sm font-semibold">Ringkasan dan hasil <span className="text-brand">*</span></label>
        <div className="relative">
          <textarea id={fieldElementIds.summary} name="summary" className={`field-control min-h-24 resize-y pb-7 ${hasError("summary") ? "border-red-500 focus:border-red-600 focus:ring-red-100" : ""}`} placeholder="Apa yang dikerjakan, hasilnya, buktinya." maxLength={500} value={summary} onChange={(event) => { setSummary(event.currentTarget.value); notifyFieldChange("summary"); }} required aria-invalid={hasError("summary")} aria-describedby={hasError("summary") ? fieldErrorIds.summary : undefined} />
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

      <fieldset id={fieldElementIds.status} tabIndex={-1} disabled={loading || blocked || saving} aria-invalid={hasError("status")} aria-describedby={hasError("status") ? fieldErrorIds.status : undefined}>
        <legend className="mb-2 text-sm font-semibold">Status <span className="text-brand">*</span></legend>
          <StatusSegmented value={status} onChange={(value) => { setStatus(value); notifyFieldChange("status"); }} />
        {showError("status")}
      </fieldset>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onCancel} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Batal</button>
        <button type="submit" disabled={loading || blocked || saving || projects.length === 0 || taskTypes.length === 0 || workStatuses.length === 0} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">{saving ? "Menyimpan..." : "Simpan task"}</button>
      </div>
    </form>
  );
}

type ContinueSuggestion = {
  key: number;
  ticket: string | null;
  summary: string;
  project: ProjectOption | null;
  type: TaskTypeOption | null;
};

/**
 * Mencocokkan saran "Lanjutkan" (yang membawa nama) dengan pilihan form (yang
 * memakai id). Saran tanpa proyek yang cocok disembunyikan karena proyek wajib
 * dipilih dan proyek tersebut mungkin sudah tidak aktif.
 */
function buildContinueSuggestions(
  tasks: ContinueTask[],
  projects: ProjectOption[],
  taskTypes: TaskTypeOption[]
): ContinueSuggestion[] {
  return tasks.flatMap((task) => {
    const project = projects.find((item) => namesMatch(item.project_name, task.project));
    if (!project) return [];

    return [{
      key: task.id,
      ticket: task.ticket,
      summary: task.summary,
      project,
      type: taskTypes.find((item) => namesMatch(item.name, task.type)) ?? null,
    }];
  });
}

function namesMatch(option: string, suggestion: string | null) {
  if (!suggestion) return false;
  return option.trim().toLowerCase() === suggestion.trim().toLowerCase();
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

function isValidTicket(ticket: string) {
  return /^(?:[A-Za-z][A-Za-z0-9]*-[0-9]+)?$/.test(ticket);
}

type ValidationInput = {
  projectSelected: boolean;
  typeSelected: boolean;
  statusSelected: boolean;
  ticket: string;
  startTime: string;
  summary: string;
  durationSelection: string;
  customDuration: string;
};

function validateForm(input: ValidationInput): Partial<Record<TaskFormField, string>> {
  const errors: Partial<Record<TaskFormField, string>> = {};
  if (!input.projectSelected) errors.project = "Proyek wajib dipilih.";
  if (!input.typeSelected) errors.type = "Pilih jenis task yang tersedia.";
  if (!input.statusSelected) errors.status = "Status pekerjaan tidak tersedia dari server.";
  if (!input.summary.trim()) errors.summary = "Ringkasan wajib diisi.";
  if (!input.startTime) errors.startTime = "Jam mulai wajib diisi.";
  const durationError = validateDuration(input.durationSelection, input.customDuration);
  if (durationError) errors.duration = durationError;
  if (input.ticket.trim() && !isValidTicket(input.ticket.trim())) {
    errors.ticket = "Format tiket tidak valid. Contoh: ABC-154";
  }
  return errors;
}

function validateDuration(selection: string, customDuration: string) {
  if (!selection) return "Durasi wajib dipilih.";
  if (selection === "other" && !customDuration.trim()) return "Durasi wajib diisi.";
  const minutes = selection === "other" ? Number(customDuration) : Number(selection);
  if (!Number.isFinite(minutes) || minutes < 5 || minutes > 1440) {
    return "Durasi harus antara 5 dan 1440 menit.";
  }
  return undefined;
}

function normalizeFormField(field: string): TaskFormField | undefined {
  if (fieldOrder.includes(field as TaskFormField)) return field as TaskFormField;
  return apiFieldMap[field];
}

function withFieldLabel(item: ErrorItem, field: TaskFormField | undefined): ErrorItem {
  if (!field) return { ...item, field: undefined };
  const label = `${fieldLabels[field]}: `;
  return {
    ...item,
    field,
    message: item.message.startsWith(label) ? item.message : `${label}${item.message}`,
  };
}
