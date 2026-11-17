"use client";

import { Info } from "lucide-react";
import type { ErrorItem } from "@/lib/errorItems";
import { summaryTitle } from "@/lib/errorItems";

type ErrorNoticeProps = {
  items: ErrorItem[];
  variant?: "summary" | "banner";
  title?: string;
  onSelectField?: (field: string) => void;
  className?: string;
  id?: string;
};

export function ErrorNotice({
  items,
  variant = "summary",
  title,
  onSelectField,
  className = "",
  id,
}: ErrorNoticeProps) {
  if (items.length === 0) return null;

  const heading = title ?? (variant === "summary" ? summaryTitle(items.length) : "Perlu diperhatikan");
  const containerClassName = [
    "rounded-lg border border-amber-200 bg-amber-50 p-4 text-slate-800",
    className,
  ].filter(Boolean).join(" ");

  return (
    <section id={id} role="alert" aria-live="assertive" tabIndex={-1} className={containerClassName}>
      <div className="flex items-start gap-3">
        <Info aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-amber-700" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">{heading}</h2>
          {variant === "banner" ? (
            <p className="mt-1 text-sm leading-5 text-slate-700">{items[0].message}</p>
          ) : (
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-5 text-slate-700">
              {items.map((item) => (
                <li key={item.id}>
                  {item.field && onSelectField ? (
                    <button
                      type="button"
                      className="rounded-sm text-left underline decoration-slate-400 underline-offset-2 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      onClick={() => onSelectField(item.field!)}
                    >
                      {item.message}
                    </button>
                  ) : (
                    item.message
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}