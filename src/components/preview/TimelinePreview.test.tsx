import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TimelinePreview } from "@/components/preview/TimelinePreview";

describe("TimelinePreview", () => {
  it("adds timeline rows for tasks after the regular workday", () => {
    render(
      <TimelinePreview
        date={new Date("2026-11-17T00:00:00")}
        onChangeDate={vi.fn()}
        onAddTask={vi.fn()}
        savedTasks={[
          {
            project: "Alpha",
            projectColor: "blue",
            ticket: "",
            startTime: "18:00",
            durationMinutes: 60,
            type: "Development",
            summary: "Menyelesaikan fitur",
            workStatus: "BERJALAN",
          },
        ]}
        onEditTask={vi.fn()}
        onDeleteTask={vi.fn()}
        loading={false}
        emptyMessage=""
        status="DRAF"
        day={null}
        submittedAt={null}
        readOnly={false}
        lockMessage={null}
        deadlineLabel={null}
        rejectionReason={null}
        canWithdraw={false}
        canSubmit={false}
        submitting={false}
        onSubmit={vi.fn()}
        withdrawing={false}
        onWithdraw={vi.fn()}
      />,
    );

    expect(screen.getByText("19.00")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tambah task pukul 18:30" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Development/ })).toHaveStyle({
      gridRow: "21 / span 2",
    });
  });
});
