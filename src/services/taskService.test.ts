import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/services/apiClient";
import { taskService, type DayInfo } from "@/services/taskService";

vi.mock("@/services/apiClient", () => ({
  apiFetch: vi.fn(),
}));

const mockedFetch = vi.mocked(apiFetch);

const dayInfo: DayInfo = {
  date: "2026-11-17",
  holidayName: null,
  onLeave: false,
  weekend: false,
  workingDay: true,
};

describe("taskService.getCalendar", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it("meminta kalender untuk rentang tanggal yang diberikan", async () => {
    mockedFetch.mockResolvedValue([dayInfo]);

    await taskService.getCalendar("2026-11-01", "2026-11-30");

    expect(mockedFetch).toHaveBeenCalledWith(
      "/api/calendar?from=2026-11-01&to=2026-11-30",
    );
  });

  it("menyertakan userId saat kalender anggota tim diminta", async () => {
    mockedFetch.mockResolvedValue([dayInfo]);

    await taskService.getCalendar("2026-11-01", "2026-11-30", 12);

    expect(mockedFetch).toHaveBeenCalledWith(
      "/api/calendar?from=2026-11-01&to=2026-11-30&userId=12",
    );
  });

  it("mengembalikan data hari dari API", async () => {
    mockedFetch.mockResolvedValue([dayInfo]);

    await expect(
      taskService.getCalendar("2026-11-17", "2026-11-17"),
    ).resolves.toEqual([dayInfo]);
  });

  it("meneruskan galat API kepada pemanggil", async () => {
    mockedFetch.mockRejectedValue(new Error("kalender gagal"));

    await expect(
      taskService.getCalendar("2026-11-17", "2026-11-17"),
    ).rejects.toThrow("kalender gagal");
  });
});
