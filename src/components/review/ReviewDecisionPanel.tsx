"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Dialog } from "@/components/shared/Dialog";
import { getReviewActions } from "@/lib/reviewPermissions";
import { REJECTION_REASON_MAX, validateRejectionReason } from "@/lib/reviewValidation";
import { ApiError } from "@/services/apiClient";
import {
  approveCorrection,
  approveDailyLog,
  rejectDailyLog,
} from "@/services/reviewService";
import type { ReviewDailyLog } from "@/types/review";

type ReviewDecisionPanelProps = {
  log: ReviewDailyLog;
  onUpdated: (log: ReviewDailyLog) => void;
};

type DecisionAction = "approve" | "approveCorrection";
type PendingAction = DecisionAction | "reject";

export function ReviewDecisionPanel({ log, onUpdated }: ReviewDecisionPanelProps) {
  const { user } = useAuth();
  const { canApprove, canReject, canApproveCorrection, reason } = getReviewActions(log, user);
  const [formOpen, setFormOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [dialogAction, setDialogAction] = useState<DecisionAction | null>(null);
  const requestInProgress = useRef(false);
  const panelRef = useRef<HTMLElement>(null);
  const approveButtonRef = useRef<HTMLButtonElement>(null);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);
  const correctionButtonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogReturnRef = useRef<HTMLButtonElement | null>(null);
  const reasonId = useId();
  const validationId = useId();

  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${log.logDate}T12:00:00+07:00`));

  useEffect(() => {
    if (formOpen) textareaRef.current?.focus();
  }, [formOpen]);

  const restoreDialogFocus = () => {
    window.setTimeout(() => dialogReturnRef.current?.focus(), 0);
  };

  const openConfirmation = (action: DecisionAction) => {
    dialogReturnRef.current = action === "approve"
      ? approveButtonRef.current
      : correctionButtonRef.current;
    setErrorMessage("");
    setDialogAction(action);
  };

  const runDecision = async (action: PendingAction, reasonText = "") => {
    if (requestInProgress.current) return;
    requestInProgress.current = true;
    setPendingAction(action);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updatedLog = action === "approve"
        ? await approveDailyLog(log)
        : action === "approveCorrection"
          ? await approveCorrection(log)
          : await rejectDailyLog(log, reasonText);
      onUpdated(updatedLog);
      setFormOpen(false);
      setRejectionReason("");
      setValidationMessage("");
      setSuccessMessage(
        action === "approve"
          ? "Daily Log disetujui."
          : action === "reject"
            ? "Daily Log ditolak. Talent akan melihat alasannya."
            : "Perbaikan disetujui. Daily Log dibuka kembali sebagai draf untuk talent.",
      );
      window.setTimeout(() => panelRef.current?.focus(), 0);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Keputusan belum dapat disimpan.",
      );
    } finally {
      requestInProgress.current = false;
      setPendingAction(null);
    }
  };

  const confirmDecision = () => {
    if (!dialogAction || requestInProgress.current) return;
    const action = dialogAction;
    setDialogAction(null);
    restoreDialogFocus();
    void runDecision(action);
  };

  const cancelConfirmation = () => {
    setDialogAction(null);
    restoreDialogFocus();
  };

  const submitRejection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateRejectionReason(rejectionReason);
    if (validation) {
      setValidationMessage(validation);
      textareaRef.current?.focus();
      return;
    }

    setValidationMessage("");
    void runDecision("reject", rejectionReason);
  };

  const cancelRejection = () => {
    setFormOpen(false);
    setRejectionReason("");
    setValidationMessage("");
    setErrorMessage("");
    window.setTimeout(() => rejectButtonRef.current?.focus(), 0);
  };

  const disabled = pendingAction !== null;
  const noActionAvailable = !canApprove && !canReject && !canApproveCorrection;

  return (
    <section
      ref={panelRef}
      tabIndex={-1}
      aria-label="Panel keputusan Daily Log"
      aria-busy={disabled}
      className="mt-5 space-y-3 outline-none"
    >
      {noActionAvailable && reason ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-5 text-slate-700">
          {reason}
        </p>
      ) : null}

      {canApprove && canReject ? (
        <>
          <button
            ref={approveButtonRef}
            type="button"
            disabled={disabled}
            onClick={() => openConfirmation("approve")}
            className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {pendingAction === "approve" ? "Mengirim..." : "Setujui"}
          </button>
          <button
            ref={rejectButtonRef}
            type="button"
            disabled={disabled}
            onClick={() => {
              setFormOpen(true);
              setErrorMessage("");
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {pendingAction === "reject" ? "Mengirim..." : "Tolak dengan alasan"}
          </button>
          {formOpen ? (
            <form onSubmit={submitRejection} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label htmlFor={reasonId} className="text-sm font-semibold text-slate-800">
                Alasan penolakan (wajib)
              </label>
              <textarea
                ref={textareaRef}
                id={reasonId}
                value={rejectionReason}
                onChange={(event) => {
                  setRejectionReason(event.target.value);
                  if (validationMessage) setValidationMessage("");
                }}
                rows={4}
                aria-invalid={Boolean(validationMessage)}
                aria-describedby={validationMessage ? validationId : undefined}
                placeholder="Jelaskan bagian yang perlu dilengkapi, misalnya hasil atau bukti task."
                disabled={disabled}
                className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-5 text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              />
              {validationMessage ? (
                <p id={validationId} role="alert" className="mt-1 text-sm text-slate-700">
                  {validationMessage}
                </p>
              ) : null}
              <p className="mt-1 text-right text-xs text-slate-500">
                {rejectionReason.length} / {REJECTION_REASON_MAX}
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelRejection}
                  disabled={disabled}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={disabled}
                  className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  {pendingAction === "reject" ? "Mengirim..." : "Kirim penolakan"}
                </button>
              </div>
            </form>
          ) : null}
        </>
      ) : null}

      {canApproveCorrection ? (
        <button
          ref={correctionButtonRef}
          type="button"
          disabled={disabled}
          onClick={() => openConfirmation("approveCorrection")}
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {pendingAction === "approveCorrection" ? "Mengirim..." : "Setujui perbaikan"}
        </button>
      ) : null}

      {errorMessage ? (
        <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-slate-800">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p role="status" className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm leading-5 text-teal-900">
          {successMessage}
        </p>
      ) : null}

      <Dialog
        open={dialogAction !== null}
        title={dialogAction === "approveCorrection" ? "Setujui perbaikan?" : "Setujui Daily Log?"}
        confirmLabel="Setujui"
        cancelLabel="Batal"
        onConfirm={confirmDecision}
        onCancel={cancelConfirmation}
      >
        {dialogAction === "approveCorrection"
          ? `Setujui perbaikan Daily Log ${log.talentName ?? "Pengguna"} untuk ${formattedDate}?`
          : `Setujui Daily Log ${log.talentName ?? "Pengguna"} untuk ${formattedDate}?`}
      </Dialog>
    </section>
  );
}