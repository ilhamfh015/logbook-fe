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

  it("mengambil detail Daily Log talent berdasarkan user dan tanggal", async () => {
    mockedApiFetch.mockResolvedValue(undefined);

    await adminService.getTalentDailyLog(10, "2026-11-25");

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/api/daily-logs/users/10?date=2026-11-25",
    );
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



describe("adminService Import CSV", () => {
  beforeEach(() => {
    mockedApiFetch.mockReset();
  });

  it("mengirim file CSV melalui FormData ke endpoint import", async () => {
    const file = new File(["email,nama"], "users.csv", {
      type: "text/csv",
    });

    mockedApiFetch.mockResolvedValue({
      created: 2,
      updated: 1,
      importedEmails: ["rina@contoh.id", "admin@contoh.id"],
    });

    await expect(adminService.importUsers(file)).resolves.toEqual({
      created: 2,
      updated: 1,
      importedEmails: ["rina@contoh.id", "admin@contoh.id"],
    });

    expect(mockedApiFetch).toHaveBeenCalledOnce();

    const [url, options] = mockedApiFetch.mock.calls[0];

    expect(url).toBe("/api/admin/users/import");
    expect(options).toMatchObject({
      method: "POST",
    });
    expect(options?.body).toBeInstanceOf(FormData);
    expect((options?.body as FormData).get("file")).toBe(file);
  });
});