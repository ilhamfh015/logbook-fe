import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { AppSidebar } from "@/components/layout/AppSidebar";

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: mockUseAuth,
}));

function expectDesktopGroups(groups: string[]) {
  const sidebar = screen.getByRole("complementary", { name: "Navigasi utama" });
  const headings = Array.from(sidebar.querySelectorAll("nav > p"))
    .map((heading) => heading.textContent)
    .filter((heading): heading is string => heading !== null);

  expect(headings).toEqual(groups);
  return within(sidebar);
}

describe("AppSidebar menu Tim", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it("menampilkan tiga grup ATASAN dan Tim aktif pada halaman review", () => {
    mockUseAuth.mockReturnValue({ user: { roles: ["ATASAN"] } });

    render(<AppSidebar activeItem="review" />);

    const sidebar = expectDesktopGroups(["LOG BOOK SAYA", "Lainnya", "ATASAN"]);

    const teamLinks = sidebar.getAllByRole("link", { name: "Tim" });
    expect(teamLinks.length).toBeGreaterThan(0);
    expect(teamLinks.every((link) => link.getAttribute("href") === "/atasan/tim")).toBe(true);
    expect(teamLinks.every((link) => link.getAttribute("aria-current") === "page")).toBe(true);
  });

  it("menampilkan tiga grup ATASAN dan mengaktifkan Daily Log", () => {
    mockUseAuth.mockReturnValue({ user: { roles: ["ATASAN"] } });

    render(<AppSidebar />);

    const sidebar = expectDesktopGroups(["LOG BOOK SAYA", "Lainnya", "ATASAN"]);
    expect(sidebar.getByRole("link", { name: "Daily Log" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(sidebar.getByRole("link", { name: "Tim" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("menampilkan tiga grup ATASAN dan mengaktifkan Tim di halaman Tim", () => {
    mockUseAuth.mockReturnValue({ user: { roles: ["ATASAN"] } });

    render(<AppSidebar activeItem="tim" />);

    const sidebar = expectDesktopGroups(["LOG BOOK SAYA", "Lainnya", "ATASAN"]);
    expect(sidebar.getByRole("link", { name: "Tim" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("tidak menampilkan menu Tim untuk TALENT", () => {
    mockUseAuth.mockReturnValue({ user: { roles: ["TALENT"] } });

    render(<AppSidebar />);

    const sidebar = expectDesktopGroups(["LOG BOOK SAYA", "Lainnya"]);
    expect(sidebar.queryByText("ATASAN")).not.toBeInTheDocument();
    expect(sidebar.queryByRole("link", { name: "Tim" })).not.toBeInTheDocument();
  });

  it("menampilkan tiga grup ADMIN dan mempertahankan menu serta state aktifnya", () => {
    mockUseAuth.mockReturnValue({ user: { roles: ["ADMIN"] } });

    render(<AppSidebar activeItem="libur-cuti" />);

    const sidebar = expectDesktopGroups(["LOG BOOK SAYA", "Lainnya", "ADMIN"]);
    expect(sidebar.queryByText("ATASAN")).not.toBeInTheDocument();
    expect(sidebar.getByRole("link", { name: "Libur & Cuti" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(sidebar.getByRole("link", { name: "Pengguna" })).toHaveAttribute(
      "href",
      "/admin/pengguna",
    );
  });

  it("mengurutkan grup ATASAN sebelum ADMIN untuk pengguna dengan kedua peran", () => {
    mockUseAuth.mockReturnValue({ user: { roles: ["ATASAN", "ADMIN"] } });

    render(<AppSidebar activeItem="review" />);

    const sidebar = expectDesktopGroups([
      "LOG BOOK SAYA",
      "Lainnya",
      "ATASAN",
      "ADMIN",
    ]);
    expect(sidebar.getByRole("link", { name: "Tim" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});