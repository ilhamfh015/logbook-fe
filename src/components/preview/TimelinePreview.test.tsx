import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TimelinePreview } from "@/components/preview/TimelinePreview";
import type { TaskDraft } from "@/types/task";

function overnightTask(overrides: Partial<TaskDraft> = {}): TaskDraft {
  return {
    project: "Alpha",
    projectColor: "blue",
    ticket: "",
    startTime: "23:00",
    startMinute: 23 * 60,
    durationMinutes: 120,
    type: "Development",
    summary: "Menyelesaikan fitur",
    workStatus: "BERJALAN",
    ...overrides,
  };
}

function renderTimeline({
  date = new Date("2026-11-17T00:00:00"),
  savedTasks = [],
  previousDayTasks = [],
  onAddTask = vi.fn(),
}: {
  date?: Date;
  savedTasks?: TaskDraft[];
  previousDayTasks?: TaskDraft[];
  onAddTask?: (startMinute?: number) => void;
} = {}) {
  render(
    <TimelinePreview
      date={date}
      onChangeDate={vi.fn()}
      onAddTask={onAddTask}
      savedTasks={savedTasks}
      previousDayTasks={previousDayTasks}
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
}

describe("TimelinePreview", () => {
  it("adds timeline rows for tasks after the regular workday", () => {
    renderTimeline({
      savedTasks: [
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
      ],
    });

    expect(screen.getByText("19.00")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tambah task pukul 18:30" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Development/ })).toHaveStyle({
      gridRow: "21 / span 2",
    });
  });

  it("berhenti di 24.00 dan tidak menampilkan jam 25, 26, 27", () => {
    renderTimeline({ savedTasks: [overnightTask()] });

    expect(screen.getByText("24.00")).toBeInTheDocument();
    expect(screen.queryByText("25.00")).not.toBeInTheDocument();
    expect(screen.queryByText("26.00")).not.toBeInTheDocument();
    expect(screen.getByText("Lanjut setelah 24.00")).toBeInTheDocument();
    expect(
      screen.getByText(/Lanjutannya \(00.00–08.00\) diisi pada tanggal 18 Nov/),
    ).toBeInTheDocument();
  });

  it("menampilkan overtime hari sebelumnya pada tanggal berikutnya sebagai bagian dini hari", () => {
    renderTimeline({
      date: new Date("2026-11-18T00:00:00"),
      previousDayTasks: [overnightTask()],
    });

    expect(screen.getByText("Dini hari")).toBeInTheDocument();
    expect(screen.getByText("00.00")).toBeInTheDocument();
    expect(screen.getByText("02.00")).toBeInTheDocument();
    expect(screen.getByText("Lanjutan 17 Nov")).toBeInTheDocument();
    // Bagian lanjutan milik hari sebelumnya tidak dapat diubah dari sini.
    expect(
      screen.queryByRole("button", { name: /Development/ }),
    ).not.toBeInTheDocument();
  });

  it("memberi pembatas antara jam penutup dini hari dan segmen 08.00", () => {
    renderTimeline({
      date: new Date("2026-11-18T00:00:00"),
      // Selesai pukul 03.00, jadi jam penutup yang ditampilkan 04.00.
      previousDayTasks: [
        overnightTask({ startMinute: 23 * 60, durationMinutes: 240 }),
      ],
    });

    expect(screen.getByText("04.00 → 08.00")).toBeInTheDocument();
    // Label 08.00 tetap satu karena jam penutup dini hari berhenti di 04.00.
    expect(screen.getAllByText("08.00")).toHaveLength(1);
  });

  it("tidak menampilkan pembatas bila overtime sudah mencapai 08.00", () => {
    renderTimeline({
      date: new Date("2026-11-18T00:00:00"),
      previousDayTasks: [
        overnightTask({ startMinute: 23 * 60, durationMinutes: 600 }),
      ],
    });

    expect(screen.queryByText(/→ 08\.00/)).not.toBeInTheDocument();
    expect(screen.getAllByText("08.00")).toHaveLength(1);
  });

  it("membatasi area tambahan tepat satu jam setelah task berakhir", () => {
    renderTimeline({
      date: new Date("2026-11-18T00:00:00"),
      // Task selesai 04.20, jadi area tambahan berhenti di 05.30.
      previousDayTasks: [
        overnightTask({ startMinute: 23 * 60, durationMinutes: 320 }),
      ],
    });

    expect(screen.getByText("05.30")).toBeInTheDocument();
    expect(screen.getByText("05.30 → 08.00")).toBeInTheDocument();
    expect(screen.queryByText("06.00")).not.toBeInTheDocument();
    expect(screen.getAllByText("08.00")).toHaveLength(1);
  });

  it("mengirim menit absolut saat slot dini hari diklik", async () => {
    const user = userEvent.setup();
    const onAddTask = vi.fn();
    renderTimeline({
      date: new Date("2026-11-18T00:00:00"),
      previousDayTasks: [overnightTask()],
      onAddTask,
    });

    await user.click(screen.getByRole("button", { name: "Tambah task pukul 01:30" }));

    expect(onAddTask).toHaveBeenCalledWith(90);
  });

  it("menampilkan task dini hari milik tanggal itu sebagai task yang dapat diedit", () => {
    renderTimeline({
      date: new Date("2026-11-18T00:00:00"),
      savedTasks: [
        overnightTask({
          id: "7",
          startTime: "01:00",
          startMinute: 60,
          durationMinutes: 30,
        }),
      ],
    });

    expect(screen.getByRole("button", { name: /Development/ })).toBeInTheDocument();
    expect(screen.getByText("1 task")).toBeInTheDocument();
  });
});
