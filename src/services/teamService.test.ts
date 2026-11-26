import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "@/services/apiClient";
import { getPendingDays, getTeam } from "@/services/teamService";

vi.mock("@/services/apiClient", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/services/apiClient")>(),
  apiFetch: vi.fn(),
}));

const mockedApiFetch = vi.mocked(apiFetch);

describe("getTeam", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it("requests atasan scope by default", async () => {
    const response = [{ userId: 3, fullName: "Rina Aulia" }];
    mockedApiFetch.mockResolvedValue(response);

    await expect(getTeam()).resolves.toEqual(response);
    expect(mockedApiFetch).toHaveBeenCalledWith("/api/team?scope=ATASAN");
  });

  it("requests admin scope when asked", async () => {
    mockedApiFetch.mockResolvedValue([]);

    await expect(getTeam("ADMIN")).resolves.toEqual([]);
    expect(mockedApiFetch).toHaveBeenCalledWith("/api/team?scope=ADMIN");
  });

  it("returns an empty list for a non-array response", async () => {
    mockedApiFetch.mockResolvedValue({ members: [] });

    await expect(getTeam()).resolves.toEqual([]);
  });
});

describe("getPendingDays", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it("requests the full pending-days list without query parameters", async () => {
    const response = [{
      userId: 3,
      dailyLogId: 91,
      date: "2026-11-09",
      totalDurationMinutes: 480,
      submittedAt: "2026-11-10T01:00:00Z",
      autoSubmitted: true,
    }];
    mockedApiFetch.mockResolvedValue(response);

    await expect(getPendingDays()).resolves.toEqual(response);
    expect(mockedApiFetch).toHaveBeenCalledWith("/api/team/pending-days");
  });

  it("requests repair days with the supported status filter", async () => {
    mockedApiFetch.mockResolvedValue([]);

    await expect(getPendingDays("PERBAIKAN_DIAJUKAN")).resolves.toEqual([]);
    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/api/team/pending-days?status=PERBAIKAN_DIAJUKAN",
    );
  });

  it("returns an empty list for empty or malformed response data", async () => {
    mockedApiFetch.mockResolvedValueOnce([]);
    await expect(getPendingDays()).resolves.toEqual([]);

    mockedApiFetch.mockResolvedValueOnce([
      { userId: 3, date: "2026-02-30" },
      { userId: 0, date: "2026-11-09" },
      null,
    ]);
    await expect(getPendingDays()).resolves.toEqual([]);
  });

  it("normalizes missing optional fields without throwing", async () => {
    mockedApiFetch.mockResolvedValue([{
      userId: 3,
      date: "2026-11-09",
      totalDurationMinutes: null,
    }]);

    await expect(getPendingDays()).resolves.toEqual([{
      userId: 3,
      dailyLogId: null,
      date: "2026-11-09",
      totalDurationMinutes: null,
      submittedAt: null,
      autoSubmitted: false,
    }]);
  });

  it("passes HTTP errors through unchanged", async () => {
    const error = new ApiError(403, "Forbidden");
    mockedApiFetch.mockRejectedValue(error);

    await expect(getPendingDays()).rejects.toBe(error);
  });

  it("passes filtered HTTP errors through unchanged", async () => {
    const error = new ApiError(400, "Nilai parameter status tidak valid");
    mockedApiFetch.mockRejectedValue(error);

    await expect(getPendingDays("PERBAIKAN_DIAJUKAN")).rejects.toBe(error);
  });
});