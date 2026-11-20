import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "@/app/login/page";
import type { AuthUser } from "@/types/auth";

const { replace, login, authState } = vi.hoisted(() => {
  const login = vi.fn();
  return {
    replace: vi.fn(),
    login,
    authState: {
      value: {
        user: null,
        loading: false,
        login,
        changePassword: vi.fn(),
        logout: vi.fn(),
      },
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => authState.value,
}));

const forcedUser: AuthUser = {
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

describe("halaman login", () => {
  beforeEach(() => {
    replace.mockReset();
    login.mockReset();
    authState.value.user = null;
    authState.value.loading = false;
  });

  it("mengarahkan ke halaman ganti kata sandi setelah login dengan flag aktif", async () => {
    const event = userEvent.setup();
    login.mockResolvedValue(forcedUser);

    render(<LoginPage />);
    await event.type(screen.getByLabelText("Email"), forcedUser.email);
    await event.type(screen.getByLabelText("Kata sandi"), "Logbook@2026");
    await event.click(screen.getByRole("button", { name: "Masuk" }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith(forcedUser.email, "Logbook@2026");
    });
    expect(replace).toHaveBeenCalledWith("/change-password");
  });

  it("mengarahkan ke beranda setelah login biasa", async () => {
    const event = userEvent.setup();
    login.mockResolvedValue({ ...forcedUser, mustChangePassword: false });

    render(<LoginPage />);
    await event.type(screen.getByLabelText("Email"), forcedUser.email);
    await event.type(screen.getByLabelText("Kata sandi"), "Logbook@2026");
    await event.click(screen.getByRole("button", { name: "Masuk" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });
});
