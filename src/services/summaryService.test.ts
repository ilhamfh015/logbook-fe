import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/services/apiClient";
import { summaryService } from "@/services/summaryService";
import type { SummaryResponse } from "@/types/summary";

vi.mock("@/services/apiClient", () => ({
  apiFetch: vi.fn(),
}));

const mockedFetch = vi.mocked(apiFetch);

const summaryResponse: SummaryResponse = {
  totalMinutes: 480,
  daysRecorded: 5,
  workdays: 5,
  perType: [{ name: "Development", minutes: 480 }],
  perProject: [{ name: "Logbook", color: "#0A6FD6", minutes: 480 }],
  done: [],
  ongoing: [],
  obstacles: [],
  shortSummaryDays: [],
};

describe("summaryService.getSummary", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it("meminta rekap mingguan dengan period dan date", async () => {
    mockedFetch.mockResolvedValue(summaryResponse);

    await summaryService.getSummary("WEEK", "2026-11-24");

    expect(mockedFetch).toHaveBeenCalledWith("/api/summary?period=WEEK&date=2026-11-24");
  });

  it("meminta rekap bulanan tanpa date opsional", async () => {
    mockedFetch.mockResolvedValue(summaryResponse);

    await summaryService.getSummary("MONTH");

    expect(mockedFetch).toHaveBeenCalledWith("/api/summary?period=MONTH");
  });

  it("mengembalikan data ringkasan dari API", async () => {
    mockedFetch.mockResolvedValue(summaryResponse);

    await expect(summaryService.getSummary("WEEK", "2026-11-24")).resolves.toEqual(summaryResponse);
  });

  it("meneruskan galat API kepada pemanggil", async () => {
    mockedFetch.mockRejectedValue(new Error("ringkasan gagal"));

    await expect(summaryService.getSummary("WEEK", "2026-11-24")).rejects.toThrow("ringkasan gagal");
  });
});
