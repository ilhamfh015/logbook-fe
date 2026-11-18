import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppHeader } from "@/components/layout/AppHeader";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: { fullName: "Budi Santoso", email: "budi@example.com", roles: ["TALENT"] },
    logout: vi.fn(),
  }),
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
