import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChangePasswordPage from "@/app/change-password/page";
import { ApiError } from "@/services/apiClient";
import type { AuthUser } from "@/types/auth";

const { replace, changePassword, logout, authState } = vi.hoisted(() => {
  const changePassword = vi.fn();
  const logout = vi.fn();
  const user: AuthUser = {
    id: 1,
    email: "rina.talent@contoh.id",
    fullName: "Rina Talent",
    jenis: "MAGANG",
    emailAtasan: null,
    admin: false,
    mustChangePassword: true,
    roles: ["TALENT"],
    isActive: true,
  };

  return {
    replace: vi.fn(),
    changePassword,
    logout,
    authState: { value: { user, loading: false, changePassword, logout } },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => authState.value,
}));

async function fillForm(user: ReturnType<typeof userEvent.setup>, confirmation = "Logbook@2027") {
  await user.type(screen.getByLabelText("Kata sandi saat ini"), "Logbook@2026");
  await user.type(screen.getByLabelText("Kata sandi baru"), "Logbook@2027");
  await user.type(screen.getByLabelText("Ulangi kata sandi baru"), confirmation);
}

describe("halaman ganti kata sandi", () => {
  beforeEach(() => {
    replace.mockReset();
    changePassword.mockReset();
    logout.mockReset();
    authState.value.user.mustChangePassword = true;
    authState.value.loading = false;
  });

  it("mengirim kata sandi baru lalu kembali ke beranda", async () => {
    const event = userEvent.setup();
    changePassword.mockResolvedValue({
      ...authState.value.user,
      mustChangePassword: false,
    });

    render(<ChangePasswordPage />);
    await fillForm(event);
    await event.click(screen.getByRole("button", { name: "Simpan kata sandi" }));

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith("Logbook@2026", "Logbook@2027");
    });
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("menolak konfirmasi kata sandi yang tidak cocok", async () => {
    const event = userEvent.setup();

    render(<ChangePasswordPage />);
    await fillForm(event, "Logbook@2028");
    await event.click(screen.getByRole("button", { name: "Simpan kata sandi" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Konfirmasi kata sandi tidak cocok.");
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("menampilkan pesan galat dari API", async () => {
    const event = userEvent.setup();
    changePassword.mockRejectedValue(new ApiError(401, "Email atau kata sandi salah"));

    render(<ChangePasswordPage />);
    await fillForm(event);
    await event.click(screen.getByRole("button", { name: "Simpan kata sandi" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Email atau kata sandi salah");
  });
});
