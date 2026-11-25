import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyLogReview } from "@/components/review/DailyLogReview";
import { getTalentDailyLog } from "@/services/reviewService";
import type { ReviewDailyLog } from "@/types/review";

vi.mock("@/services/reviewService", () => ({
  getTalentDailyLog: vi.fn(),
}));

vi.mock("@/components/preview/TimelinePreview", () => ({
  TimelinePreview: () => null,
  formatDuration: () => "0 menit",
}));

vi.mock("@/components/review/ReviewDecisionPanel", () => ({
  ReviewDecisionPanel: () => null,
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
});