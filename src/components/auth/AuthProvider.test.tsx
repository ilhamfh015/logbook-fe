import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, CHANGE_PASSWORD_PATH } from "@/components/auth/AuthProvider";
import { authService } from "@/services/authService";
import type { AuthUser } from "@/types/auth";

const { replace, pathState } = vi.hoisted(() => ({
  replace: vi.fn(),
  pathState: { value: "/" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => pathState.value,
}));

vi.mock("@/services/authService", () => ({
  authService: {
    me: vi.fn(),
    login: vi.fn(),
    changePassword: vi.fn(),
    logout: vi.fn(),
  },
}));

const baseUser: AuthUser = {
  id: 1,
  email: "rina.talent@contoh.id",
  fullName: "Rina Talent",
  jenis: "MAGANG",
  emailAtasan: null,
  admin: false,
  mustChangePassword: false,
  roles: ["TALENT"],
  isActive: true,
};

function renderProvider() {
  return render(
    <AuthProvider>
      <div>konten</div>
    </AuthProvider>,
  );
}

describe("AuthProvider flag wajib ganti kata sandi", () => {
  beforeEach(() => {
    replace.mockReset();
    vi.mocked(authService.me).mockReset();
    pathState.value = "/";
  });

  it("mengarahkan pengguna dengan flag ke halaman ganti kata sandi", async () => {
    vi.mocked(authService.me).mockResolvedValue({
      ...baseUser,
      mustChangePassword: true,
    });

    renderProvider();

    await waitFor(() => expect(replace).toHaveBeenCalledWith(CHANGE_PASSWORD_PATH));
  });

  it("tidak mengarahkan ulang saat pengguna sudah berada di halaman ganti kata sandi", async () => {
    pathState.value = CHANGE_PASSWORD_PATH;
    vi.mocked(authService.me).mockResolvedValue({
      ...baseUser,
      mustChangePassword: true,
    });

    renderProvider();

    await waitFor(() => expect(authService.me).toHaveBeenCalled());
    expect(screen.getByText("konten")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("mengarahkan ke halaman ganti kata sandi saat API mengirim kode PASSWORD_CHANGE_REQUIRED", async () => {
    vi.mocked(authService.me).mockResolvedValue(baseUser);

    renderProvider();

    await waitFor(() => expect(authService.me).toHaveBeenCalled());
    expect(replace).not.toHaveBeenCalled();

    window.dispatchEvent(new Event("logbook:password-change-required"));

    await waitFor(() => expect(replace).toHaveBeenCalledWith(CHANGE_PASSWORD_PATH));
  });
});
