import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/services/apiClient";
import { adminService } from "@/services/adminService";

vi.mock("@/services/apiClient", () => ({
  apiFetch: vi.fn(),
}));

const mockedApiFetch = vi.mocked(apiFetch);

describe("adminService Daily Log", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it("mengirim filter admin daily logs yang tidak kosong", async () => {
    mockedApiFetch.mockResolvedValue([]);

    await expect(
      adminService.getAdminDailyLogs({
        date: "2026-11-25",
        userId: " 10 ",
        status: "menunggu",
      }),
    ).resolves.toEqual([]);

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/api/admin/daily-logs?date=2026-11-25&userId=10&status=menunggu",
    );
  });

  it("memakai path dasar bila semua filter kosong", async () => {
    mockedApiFetch.mockResolvedValue([]);

    await adminService.getAdminDailyLogs({
      date: "",
      userId: null,
      status: "",
    });

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/admin/daily-logs");
  });

  it("mengirim POST approve tanpa body", async () => {
    mockedApiFetch.mockResolvedValue(undefined);

    await adminService.decideDailyLog(3, "approve");

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/daily-logs/3/approve", {
      method: "POST",
    });
  });

  it("mengirim POST reject dengan alasan", async () => {
    mockedApiFetch.mockResolvedValue(undefined);

    await adminService.decideDailyLog(3, "reject", "Ringkasan kurang rinci");

    expect(mockedApiFetch).toHaveBeenCalledWith("/api/daily-logs/3/reject", {
      method: "POST",
      body: JSON.stringify({ reason: "Ringkasan kurang rinci" }),
    });
  });
});
