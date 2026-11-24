import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeamDashboard } from "@/components/atasan/TeamDashboard";
import { ApiError } from "@/services/apiClient";
import { getTeam } from "@/services/teamService";

vi.mock("@/services/teamService", () => ({
  getTeam: vi.fn(),
}));

const mockedGetTeam = vi.mocked(getTeam);

const teamResponse = [
  {
    userId: 27,
    fullName: "Rina Aulia",
    email: "rina@example.test",
    jenis: "PKL",
    date: "2026-11-17",
    dailyLogId: 73,
    status: "MENUNGGU",
    totalDurationMinutes: 420,
    pendingDays: 3,
  },
];

describe("TeamDashboard", () => {
  beforeEach(() => {
    mockedGetTeam.mockReset();
  });

  it("shows loading and then renders a member with active links", async () => {
    let resolveTeam!: (result: typeof teamResponse) => void;
    mockedGetTeam.mockReturnValue(new Promise((resolve) => {
      resolveTeam = resolve;
    }));

    render(<TeamDashboard />);

    expect(screen.getByRole("status")).toHaveTextContent("Memuat daftar tim...");
    resolveTeam(teamResponse);

    expect(await screen.findByText("Rina Aulia")).toBeInTheDocument();
    expect(screen.getByText("PKL")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Buka" })).toHaveAttribute("href", "/tim/27/2026-11-17");
    expect(screen.getByRole("link", { name: "Sel, 17 Nov · 7 j" })).toHaveAttribute(
      "href",
      "/tim/27/2026-11-17",
    );
  });

  it("shows an error banner and retries the request", async () => {
    const user = userEvent.setup();
    mockedGetTeam
      .mockRejectedValueOnce(new ApiError(403, "Anda tidak memiliki akses."))
      .mockResolvedValueOnce(teamResponse);

    render(<TeamDashboard />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Anda tidak memiliki akses.");
    await user.click(screen.getByRole("button", { name: "Coba lagi" }));

    await waitFor(() => expect(mockedGetTeam).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Rina Aulia")).toBeInTheDocument();
  });

  it("shows the empty state, disabled date controls, and no demo copy", async () => {
    mockedGetTeam.mockResolvedValue([]);

    render(<TeamDashboard />);

    expect(await screen.findByText("Belum ada anggota tim.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hari sebelumnya" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hari berikutnya" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hari sebelumnya" })).toHaveAttribute(
      "title",
      "Daftar tim saat ini hanya untuk hari ini.",
    );
    expect(screen.queryByText(/Data demonstrasi/)).not.toBeInTheDocument();
  });

  it("shows '-' when the API provides no leave or holiday statuses", async () => {
    mockedGetTeam.mockResolvedValue(teamResponse);

    render(<TeamDashboard />);

    await screen.findByText("Rina Aulia");
    const leaveCard = screen.getByText("Cuti atau libur hari ini").closest("article");
    expect(leaveCard).not.toBeNull();
    expect(within(leaveCard!).getByText("-")).toBeInTheDocument();
  });
});