import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminLeaveHolidayPage } from "@/components/admin/AdminLeaveHolidayPage";
import { adminService, type AdminLeave, type AdminTalent } from "@/services/adminService";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: { fullName: "Admin", email: "admin@contoh.id", roles: ["ADMIN"] },
    loading: false,
  }),
}));

vi.mock("@/services/adminService", () => ({
  adminService: {
    getHolidays: vi.fn(),
    getTalentOptions: vi.fn(),
    getLeaves: vi.fn(),
    addHoliday: vi.fn(),
    deleteHoliday: vi.fn(),
    addLeave: vi.fn(),
    deleteLeave: vi.fn(),
  },
}));

const talents: AdminTalent[] = [{ id: 10, full_name: "Rina Talent" }];
const leaveWithoutName = {
  id: 1,
  user_id: 10,
  full_name: null,
  start_date: "2026-11-20",
  end_date: "2026-11-22",
  note: "Cuti tahunan",
} satisfies AdminLeave;

describe("AdminLeaveHolidayPage kolom Talent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminService.getHolidays).mockResolvedValue([]);
    vi.mocked(adminService.getTalentOptions).mockResolvedValue(talents);
  });

  it("menampilkan nama talent dari respons API", async () => {
    vi.mocked(adminService.getLeaves).mockResolvedValue([
      { ...leaveWithoutName, full_name: "Rina Talent" },
    ]);

    render(<AdminLeaveHolidayPage />);

    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "Rina Talent" })).toBeInTheDocument();
    });
  });

  it("memakai daftar talent sebagai fallback bila respons API tanpa full_name", async () => {
    vi.mocked(adminService.getLeaves).mockResolvedValue([leaveWithoutName]);

    render(<AdminLeaveHolidayPage />);

    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "Rina Talent" })).toBeInTheDocument();
    });
  });
});
