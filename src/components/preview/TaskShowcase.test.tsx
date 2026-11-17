import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskShowcase } from "@/components/preview/TaskShowcase";
import { taskService, type DailyLog } from "@/services/taskService";

vi.mock("@/services/taskService", () => ({
  taskService: {
    getProjects: vi.fn(),
    getContinueTasks: vi.fn(),
    getMasterData: vi.fn(),
    getCalendar: vi.fn(),
    getDailyLog: vi.fn(),
    createDailyLog: vi.fn(),
    checkSubmit: vi.fn(),
    submitDailyLog: vi.fn(),
    withdrawDailyLog: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mocked = vi.mocked(taskService);

const draftDailyLog: DailyLog = {
  id: 55,
  logDate: "2026-11-17",
  status: "DRAF",
  submittedAt: null,
  rejectionReason: null,
  decidedByUserId: null,
  decidedAt: null,
  autoSubmitted: false,
  editable: true,
  deadline: null,
  totalDurationMinutes: 60,
  tasks: [
    {
      id: 7,
      projectId: 1,
      taskTypeId: 2,
      workStatusId: 3,
      ticket: "ABC-142",
      startTime: "08:00",
      startMinute: 480,
      durationMinutes: 60,
      summary: "Menyelesaikan fitur validasi.",
      obstacle: null,
    },
  ],
};

const shortSummaryHint = {
  taskId: 7,
  kind: "RINGKASAN_PENDEK" as const,
  message: "Ringkasan task baru 10 karakter. Disarankan minimal 20 karakter.",
};

async function renderShowcase() {
  const user = userEvent.setup();
  render(<TaskShowcase />);
  await screen.findByRole("button", { name: "Kirim Daily Log" });
  return user;
}

describe("TaskShowcase submit hints", () => {
  beforeEach(() => {
    mocked.getProjects.mockResolvedValue([
      { project_id: 1, project_name: "Alpha", client_name: "Client A", color: "blue" },
    ]);
    mocked.getMasterData.mockResolvedValue({
      types: [{ id: 2, name: "Development" }],
      statuses: [{ id: 3, name: "Berjalan" }],
      durations: [{ minutes: 60, label: "1 j" }],
    });
    mocked.getContinueTasks.mockResolvedValue([]);
    mocked.getCalendar.mockResolvedValue([
      { date: "2026-11-17", holidayName: null, onLeave: false, weekend: false, workingDay: true },
    ]);
    mocked.getDailyLog.mockResolvedValue(draftDailyLog);
    mocked.checkSubmit.mockResolvedValue({ hints: [] });
    mocked.submitDailyLog.mockResolvedValue({
      ...draftDailyLog,
      status: "MENUNGGU",
      submittedAt: "2026-11-17T09:00:00+07:00",
      editable: false,
    });
  });

  it("shows hints and does not send before the talent decides", async () => {
    mocked.checkSubmit.mockResolvedValue({ hints: [shortSummaryHint] });
    const user = await renderShowcase();

    await user.click(screen.getByRole("button", { name: "Kirim Daily Log" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(mocked.checkSubmit).toHaveBeenCalledWith(55);
    expect(within(dialog).getByText(/Task ABC-142/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Ringkasan pendek/)).toBeInTheDocument();
    expect(within(dialog).getByText(shortSummaryHint.message)).toBeInTheDocument();
    expect(mocked.submitDailyLog).not.toHaveBeenCalled();
  });

  it("sends anyway when the talent chooses Kirim saja", async () => {
    mocked.checkSubmit.mockResolvedValue({ hints: [shortSummaryHint] });
    const user = await renderShowcase();

    await user.click(screen.getByRole("button", { name: "Kirim Daily Log" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Kirim saja" }));

    await waitFor(() => expect(mocked.submitDailyLog).toHaveBeenCalledWith(55));
    expect(await screen.findByText("Daily Log berhasil dikirim.")).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("closes the hints without sending when the talent chooses Lengkapi dulu", async () => {
    mocked.checkSubmit.mockResolvedValue({ hints: [shortSummaryHint] });
    const user = await renderShowcase();

    await user.click(screen.getByRole("button", { name: "Kirim Daily Log" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Lengkapi dulu" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(mocked.submitDailyLog).not.toHaveBeenCalled();
  });

  it("asks for confirmation as usual when there are no hints", async () => {
    const user = await renderShowcase();

    await user.click(screen.getByRole("button", { name: "Kirim Daily Log" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Kirim Daily Log?")).toBeInTheDocument();
    expect(mocked.submitDailyLog).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Kirim Daily Log" }));
    await waitFor(() => expect(mocked.submitDailyLog).toHaveBeenCalledWith(55));
  });

  it("still asks for confirmation when the hint check fails", async () => {
    mocked.checkSubmit.mockRejectedValue(new Error("Koneksi terputus"));
    const user = await renderShowcase();

    await user.click(screen.getByRole("button", { name: "Kirim Daily Log" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Kirim Daily Log?")).toBeInTheDocument();
    expect(mocked.submitDailyLog).not.toHaveBeenCalled();
  });
});
