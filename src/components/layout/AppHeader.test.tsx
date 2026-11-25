import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppHeader } from "@/components/layout/AppHeader";

const authMocks = vi.hoisted(() => ({
  logout: vi.fn(async () => undefined),
  user: {
    fullName: "Budi Santoso",
    email: "budi@example.com",
    roles: ["TALENT"] as string[],
  },
}));

const routerMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
  usePathname: () => "/",
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ user: authMocks.user, logout: authMocks.logout }),
}));

describe("AppHeader notifikasi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("menampilkan tombol notifikasi dengan aria-expanded false", () => {
    render(<AppHeader />);

    expect(screen.getByRole("button", { name: "Notifikasi" })).toHaveAttribute("aria-expanded", "false");
  });

  it("membuka panel notifikasi saat tombol diklik", async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.click(screen.getByRole("button", { name: "Notifikasi" }));

    expect(screen.getByRole("button", { name: "Notifikasi" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Belum ada notifikasi baru.")).toBeInTheDocument();
  });

  it("menutup panel saat tombol diklik lagi", async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.click(screen.getByRole("button", { name: "Notifikasi" }));
    await user.click(screen.getByRole("button", { name: "Notifikasi" }));

    expect(screen.getByRole("button", { name: "Notifikasi" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Belum ada notifikasi baru.")).not.toBeInTheDocument();
  });

  it("menutup panel saat klik di luar", async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.click(screen.getByRole("button", { name: "Notifikasi" }));
    expect(screen.getByText("Belum ada notifikasi baru.")).toBeInTheDocument();

    await user.pointer({ keys: "[MouseLeft]", target: document.body });

    await waitFor(() => {
      expect(screen.queryByText("Belum ada notifikasi baru.")).not.toBeInTheDocument();
    });
  });
});

describe("AppHeader notifikasi dan menu akun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.user.roles = ["TALENT"];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("menutup panel notifikasi otomatis setelah 3,5 detik", () => {
    vi.useFakeTimers();
    render(<AppHeader />);

    fireEvent.click(screen.getByRole("button", { name: "Notifikasi" }));
    expect(screen.getByText("Belum ada notifikasi baru.")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(screen.queryByText("Belum ada notifikasi baru.")).not.toBeInTheDocument();
  });

  it("menutup panel notifikasi saat menu akun dibuka", async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.click(screen.getByRole("button", { name: "Notifikasi" }));
    await user.click(screen.getByRole("button", { name: "Menu akun Budi Santoso" }));

    expect(screen.queryByText("Belum ada notifikasi baru.")).not.toBeInTheDocument();
    expect(screen.getByText("budi@example.com")).toBeInTheDocument();
  });

  it("menampilkan peran Atasan pada menu akun", () => {
    authMocks.user.roles = ["ATASAN"];
    render(<AppHeader />);

    expect(screen.getByText("Atasan")).toBeInTheDocument();
  });

  it("mengeluarkan pengguna lalu kembali ke halaman login", async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.click(screen.getByRole("button", { name: "Menu akun Budi Santoso" }));
    await user.click(screen.getByRole("button", { name: "Keluar" }));

    await waitFor(() => expect(authMocks.logout).toHaveBeenCalledOnce());
    await waitFor(() => expect(routerMocks.replace).toHaveBeenCalledWith("/login"));
  });
});
