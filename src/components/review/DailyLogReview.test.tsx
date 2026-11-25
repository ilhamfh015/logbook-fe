import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyLogReview } from "@/components/review/DailyLogReview";
import { ApiError } from "@/services/apiClient";
import { getTalentDailyLog } from "@/services/reviewService";
import type { ReviewDailyLog } from "@/types/review";

vi.mock("@/services/reviewService", () => ({
  getTalentDailyLog: vi.fn(),
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ user: { admin: false } }),
}));

vi.mock("@/components/preview/TimelinePreview", () => ({
  TimelinePreview: () => null,
  formatDuration: () => "0 menit",
}));

vi.mock("@/components/review/ReviewDecisionPanel", () => ({
  ReviewDecisionPanel: ({ log, onUpdated }: {
    log: ReviewDailyLog;
    onUpdated: (log: ReviewDailyLog) => void;
  }) => (
    <button type="button" onClick={() => onUpdated({ ...log, status: "Disetujui" })}>
      Uji pembaruan keputusan
    </button>
  ),
}));

const reviewLog: ReviewDailyLog = {
  id: 1,
  userId: 2,
  talentName: "Rina Aulia",
  talentJenis: "PKL",
  supervisorName: "Budi Santoso",
  supervisorEmail: "budi@example.test",
  logDate: "2026-11-17",
  status: "Menunggu",
  submittedAt: null,
  autoSubmitted: false,
  rejectionReason: null,
  revisionReason: null,
  decidedByName: null,
  decidedAt: null,
  totalDurationMinutes: 0,
  tasks: [],
};

describe("DailyLogReview", () => {
  beforeEach(() => {
    vi.mocked(getTalentDailyLog).mockReset();
    vi.mocked(getTalentDailyLog).mockResolvedValue(reviewLog);
  });

  it("mengembalikan pengguna ke halaman Tim atasan", async () => {
    render(<DailyLogReview userId="2" dateIso="2026-11-17" />);

    expect(await screen.findByRole("link", { name: "‹ Kembali ke Tim" })).toHaveAttribute(
      "href",
      "/atasan/tim",
    );
  });

  it("memakai tautan kembali yang diberikan untuk halaman admin", async () => {
    render(
      <DailyLogReview
        userId="2"
        dateIso="2026-11-17"
        backHref="/admin/tim"
      />,
    );

    expect(await screen.findByRole("link", { name: "‹ Kembali ke Tim" })).toHaveAttribute(
      "href",
      "/admin/tim",
    );
  });

  it("menampilkan empty state netral saat BE tidak menemukan Daily Log", async () => {
    vi.mocked(getTalentDailyLog).mockRejectedValue(
      new ApiError(404, "Belum ada Daily Log untuk tanggal ini."),
    );

    render(<DailyLogReview userId="2" dateIso="2026-11-17" />);

    expect(await screen.findByText("Belum ada Daily Log untuk tanggal ini.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Coba lagi" })).not.toBeInTheDocument();
  });

  it("memperbarui status layar dari hasil keputusan", async () => {
    const { user } = await import("@testing-library/user-event").then(({ default: userEvent }) => ({
      user: userEvent.setup(),
    }));
    render(<DailyLogReview userId="2" dateIso="2026-11-17" />);

    await screen.findByText("Menunggu");
    await user.click(screen.getByRole("button", { name: "Uji pembaruan keputusan" }));

    expect(await screen.findByText("Disetujui")).toBeInTheDocument();
  });
});