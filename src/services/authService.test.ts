import { beforeEach, describe, expect, it, vi } from "vitest";
import { authService } from "@/services/authService";
import { apiFetch } from "@/services/apiClient";

vi.mock("@/services/apiClient", () => ({
  apiFetch: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);

const apiUser = {
  id: 1,
  email: "rina.talent@contoh.id",
  fullName: "Rina Talent",
  jenis: "MAGANG",
  emailAtasan: null,
  admin: false,
  mustChangePassword: false,
  isActive: true,
  roles: ["TALENT"],
};

describe("authService.login", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    apiFetchMock.mockResolvedValue(apiUser);
  });

  it("mengirim email dan kata sandi ke endpoint login", async () => {
    const result = await authService.login("rina.talent@contoh.id", "Logbook@2026");

    expect(apiFetchMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "rina.talent@contoh.id",
        password: "Logbook@2026",
      }),
    });
    expect(result.email).toBe("rina.talent@contoh.id");
    expect(result.roles).toEqual(["TALENT"]);
  });
});
