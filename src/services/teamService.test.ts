import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/services/apiClient";
import { getTeam } from "@/services/teamService";

vi.mock("@/services/apiClient", () => ({
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