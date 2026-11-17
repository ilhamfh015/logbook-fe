"use client";

import { Dialog } from "@/components/shared/Dialog";
import type { SubmitHint } from "@/services/taskService";

/**
 * Saran yang sudah dilengkapi tiket task agar mudah dikenali talent.
 */
export type SubmitHintItem = SubmitHint & { ticket: string | null };

type SubmitHintDialogProps = {
  open: boolean;
  hints: SubmitHintItem[];
  onFix: () => void;
  onSendAnyway: () => void;
};

/**
 * Dialog saran sebelum pengiriman (LBK-KUA-02).
 *
 * <p>Saran bersifat membantu: talent boleh kembali melengkapi task
 * ("Lengkapi dulu") atau tetap mengirim apa adanya ("Kirim saja").</p>
 */
export function SubmitHintDialog({
  open,
  hints,
  onFix,
  onSendAnyway,
}: SubmitHintDialogProps) {
  return (
    <Dialog
      open={open}
      title="Saran sebelum mengirim"
      confirmLabel="Kirim saja"
      cancelLabel="Lengkapi dulu"
      onConfirm={onSendAnyway}
      onCancel={onFix}
    >
      <p>
        {hints.length > 0
          ? `Ada ${hints.length} hal yang dapat ditingkatkan. Saran ini tidak menghalangi pengiriman.`
          : "Saran ini tidak menghalangi pengiriman."}
      </p>
      <ul className="mt-3 space-y-2">
        {hints.map((hint) => (
          <li
            key={`${hint.taskId}-${hint.kind}`}
            className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900"
          >
            <p className="text-xs font-semibold uppercase tracking-wide">
              {hint.ticket ? `Task ${hint.ticket}` : `Task #${hint.taskId}`}
              {" · "}
              {hintKindLabel(hint.kind)}
            </p>
            <p className="mt-1 text-sm leading-6">{hint.message}</p>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

const hintKindLabels: Record<string, string> = {
  RINGKASAN_PENDEK: "Ringkasan pendek",
  TASK_PANJANG: "Durasi panjang",
};

function hintKindLabel(kind: string) {
  return hintKindLabels[kind] ?? "Saran";
}
