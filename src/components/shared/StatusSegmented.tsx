"use client";

import type { WorkStatus } from "@/types/task";

type StatusSegmentedProps = {
  value: WorkStatus;
  onChange: (value: WorkStatus) => void;
  disabled?: boolean;
};

const statuses: Array<{ value: WorkStatus; label: string }> = [
  { value: "SELESAI", label: "Selesai" },
  { value: "BERJALAN", label: "Berjalan" },
  { value: "TERTAHAN", label: "Tertahan" },
];

export function StatusSegmented({ value, onChange, disabled = false }: StatusSegmentedProps) {
  return (
    <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1" role="group" aria-label="Status pekerjaan">
      {statuses.map((status) => (
        <button key={status.value} type="button" disabled={disabled} onClick={() => onChange(status.value)} className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${value === status.value ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-ink"}`} aria-pressed={value === status.value}>
          {status.label}
        </button>
      ))}
    </div>
  );
}
