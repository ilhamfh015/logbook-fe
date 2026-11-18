import { ApiError } from "@/services/apiClient";

export type ErrorItem = {
  id: string;
  message: string;
  field?: string;
  source: "form" | "server";
};

export function itemsFromFieldErrors(
  fieldErrors: Record<string, string | undefined>,
  source: "form" | "server" = "form",
): ErrorItem[] {
  return Object.entries(fieldErrors)
    .filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()))
    .map(([field, message]) => ({ id: `error-${field}`, message: message.trim(), field, source }));
}

export function itemsFromApiError(
  error: unknown,
  labelFor?: (field: string) => string | undefined,
): ErrorItem[] {
  if (!(error instanceof ApiError)) return [generalError("Terjadi kesalahan. Silakan coba lagi.")];

  const fieldItems = itemsFromFieldErrors(error.fieldErrors, "server").map((item) => {
    const label = labelFor?.(item.field!);
    return label?.trim() ? { ...item, message: `${label.trim()}: ${item.message}` } : item;
  });
  if (fieldItems.length > 0) return fieldItems;

  const message = error.message.trim();
  return [generalError(message || "Terjadi kesalahan. Silakan coba lagi.")];
}

export function mergeErrorItems(...lists: ErrorItem[][]): ErrorItem[] {
  const merged: ErrorItem[] = [];
  const seen = new Set<string>();

  for (const item of lists.flat()) {
    const key = JSON.stringify([item.field ?? null, item.message]);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged;
}

export function orderErrorItems(items: ErrorItem[], fieldOrder: string[]): ErrorItem[] {
  const fieldRanks = new Map(fieldOrder.map((field, index) => [field, index]));
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const leftRank = left.item.field === undefined
        ? Number.POSITIVE_INFINITY
        : fieldRanks.get(left.item.field) ?? fieldOrder.length;
      const rightRank = right.item.field === undefined
        ? Number.POSITIVE_INFINITY
        : fieldRanks.get(right.item.field) ?? fieldOrder.length;
      return leftRank - rightRank || left.index - right.index;
    })
    .map(({ item }) => item);
}

export function firstFieldWithError(items: ErrorItem[], fieldOrder: string[]): string | null {
  const fieldsWithErrors = new Set(items.flatMap((item) => item.field ? [item.field] : []));
  return fieldOrder.find((field) => fieldsWithErrors.has(field)) ?? null;
}

export function summaryTitle(count: number): string {
  return `Ada ${count} hal yang perlu diperbaiki`;
}

function generalError(message: string): ErrorItem {
  return { id: "error-general", message, source: "server" };
}