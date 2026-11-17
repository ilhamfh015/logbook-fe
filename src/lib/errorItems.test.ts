import { describe, expect, it } from "vitest";
import { ApiError } from "@/services/apiClient";
import {
  firstFieldWithError,
  itemsFromApiError,
  itemsFromFieldErrors,
  mergeErrorItems,
  orderErrorItems,
  summaryTitle,
} from "@/lib/errorItems";

describe("errorItems", () => {
  it("creates field items and ignores empty messages", () => {
    expect(itemsFromFieldErrors({ project: " Proyek wajib dipilih. ", summary: "  ", ticket: undefined })).toEqual([
      { id: "error-project", message: "Proyek wajib dipilih.", field: "project", source: "form" },
    ]);
    expect(itemsFromFieldErrors({ project: "Tidak tersedia." }, "server")[0].source).toBe("server");
  });

  it("creates server field items and applies optional labels", () => {
    const error = new ApiError(400, "Data tidak valid.", {
      projectId: "Proyek tidak tersedia.",
      durationMinutes: "Durasi di luar batas.",
    });

    expect(itemsFromApiError(error, (field) => ({ projectId: "Proyek", durationMinutes: "Durasi" })[field])).toEqual([
      { id: "error-projectId", message: "Proyek: Proyek tidak tersedia.", field: "projectId", source: "server" },
      { id: "error-durationMinutes", message: "Durasi: Durasi di luar batas.", field: "durationMinutes", source: "server" },
    ]);
  });

  it("creates a general item when an API error has no field errors", () => {
    expect(itemsFromApiError(new ApiError(503, "Server belum tersedia."))).toEqual([
      { id: "error-general", message: "Server belum tersedia.", source: "server" },
    ]);
  });

  it("uses a neutral fallback for non-API and empty-message errors", () => {
    const fallback = [{ id: "error-general", message: "Terjadi kesalahan. Silakan coba lagi.", source: "server" }];
    expect(itemsFromApiError(new Error("detail internal"))).toEqual(fallback);
    expect(itemsFromApiError(new ApiError(400, "   "))).toEqual(fallback);
  });

  it("merges items in order and removes duplicate field-message pairs", () => {
    const projectError = { id: "error-project", message: "Proyek belum tersedia.", field: "project", source: "form" as const };
    const summaryError = { id: "error-summary", message: "Ringkasan wajib diisi.", field: "summary", source: "server" as const };
    expect(mergeErrorItems([projectError], [summaryError, { ...projectError, source: "server" }])).toEqual([
      projectError,
      summaryError,
    ]);
  });

  it("orders known fields, unknown fields, and general errors", () => {
    const items = [
      { id: "error-general", message: "Gangguan umum.", source: "server" as const },
      { id: "error-other", message: "Gangguan lain.", field: "other", source: "server" as const },
      { id: "error-summary", message: "Ringkasan wajib diisi.", field: "summary", source: "form" as const },
      { id: "error-project", message: "Pilih proyek.", field: "project", source: "form" as const },
    ];
    expect(orderErrorItems(items, ["project", "summary"])).toEqual([items[3], items[2], items[1], items[0]]);
  });

  it("returns the first errored field in the supplied order", () => {
    const items = [
      { id: "error-summary", message: "Ringkasan wajib diisi.", field: "summary", source: "form" as const },
      { id: "error-project", message: "Pilih proyek.", field: "project", source: "server" as const },
    ];
    expect(firstFieldWithError(items, ["project", "summary"])).toBe("project");
    expect(firstFieldWithError(items, ["ticket"])).toBeNull();
  });

  it("builds a singular or plural summary title", () => {
    expect(summaryTitle(1)).toBe("Ada 1 hal yang perlu diperbaiki");
    expect(summaryTitle(4)).toBe("Ada 4 hal yang perlu diperbaiki");
  });
});