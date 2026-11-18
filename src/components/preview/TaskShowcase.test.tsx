import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskShowcase } from "@/components/preview/TaskShowcase";
import { ApiError } from "@/services/apiClient";
import { settingsService } from "@/services/settingsService";
import { taskService, type DailyLog } from "@/services/taskService";

vi.mock("@/services/settingsService", () => ({
  settingsService: {
    getSettings: vi.fn(),
  },
}));

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
const mockedSettings = vi.mocked(settingsService);

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

const longTaskHint = {
  taskId: 7,
  kind: "TASK_PANJANG" as const,
  message: "Durasi task 300 menit melebihi 240 menit. Pertimbangkan memecahnya menjadi beberapa task.",
};

async function renderShowcase() {
  const user = userEvent.setup();
  render(<TaskShowcase />);
  await screen.findByRole("button", { name: "Kirim Daily Log" }, { timeout: 5000 });
  return user;
}

function setupDefaultMocks() {
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
  mockedSettings.getSettings.mockResolvedValue({
    workStart: "08:00",
    workEnd: "17:00",
    onboarded: true,
    activeDate: "2026-11-17",
  });
}

describe("TaskShowcase submit hints", () => {
  beforeEach(setupDefaultMocks);

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

  it("shows the task summary when the task has no ticket", async () => {
    mocked.getDailyLog.mockResolvedValue({
      ...draftDailyLog,
      tasks: [{ ...draftDailyLog.tasks[0], ticket: "", summary: "cek" }],
    });
    mocked.checkSubmit.mockResolvedValue({ hints: [shortSummaryHint, longTaskHint] });
    const user = await renderShowcase();

    await user.click(screen.getByRole("button", { name: "Kirim Daily Log" }));

    const dialog = await screen.findByRole("alertdialog");
    const labels = within(dialog).getAllByText(/Task "cek"/);
    const labelText = labels.map((label) => label.textContent).join(" ");
    expect(labels).toHaveLength(2);
    expect(labelText).toContain("Ringkasan pendek");
    expect(labelText).toContain("Durasi panjang");
    expect(within(dialog).queryByText(/Task #7/)).not.toBeInTheDocument();
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

describe("TaskShowcase hari aktif server", () => {
  beforeEach(setupDefaultMocks);

  it("opens the night-shift day and keeps it editable after midnight", async () => {
    // Pukul 01.00 bagi pengguna shift malam 22.00-06.00 masih bagian shift
    // tanggal kemarin, sehingga server mengirim activeDate kemarin.
    const now = new Date();
    const shiftKey = toDateKey(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
    );
    mockedSettings.getSettings.mockResolvedValue({
      workStart: "22:00",
      workEnd: "06:00",
      onboarded: true,
      activeDate: shiftKey,
    });
    mocked.getDailyLog.mockRejectedValue(new ApiError(404, "Daily log tidak ditemukan"));

    render(<TaskShowcase />);

    await waitFor(() => expect(mocked.getDailyLog).toHaveBeenCalledWith(shiftKey));
    expect(await screen.findByRole("button", { name: "+ Tambah task" })).toBeInTheDocument();
    expect(screen.queryByText(/sudah lewat sehingga Daily Log terkunci/)).not.toBeInTheDocument();
  });
});

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
