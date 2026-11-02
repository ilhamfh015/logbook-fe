"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

type SidePanelProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function SidePanel({ title, open, onClose, children, footer }: SidePanelProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button type="button" aria-label="Tutup panel" onClick={onClose} className="fixed inset-y-0 left-0 right-0 z-20 cursor-default bg-slate-900/10 md:left-52" />
      <aside
        className="fixed inset-y-0 right-0 z-30 flex w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div><h2 className="text-xl font-bold text-ink">{title}</h2><p className="mt-1 text-sm text-slate-500">Buat dan catat tugas baru pada Log Book.</p></div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Tutup panel"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer ? <div className="border-t border-slate-200 bg-white p-5">{footer}</div> : null}
      </aside>
    </>
  );
}
