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
const dailyLog: DailyLog = {
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

async function renderShowcase() {
  const user = userEvent.setup();
  render(<TaskShowcase />);
  await screen.findByRole("button", { name: "Kirim Daily Log" }, { timeout: 5000 });
  return user;
}

describe("TaskShowcase delete errors", () => {
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
    mocked.getDailyLog.mockResolvedValue(dailyLog);
    mockedSettings.getSettings.mockResolvedValue({
      workStart: "08:00",
      workEnd: "17:00",
      onboarded: true,
      activeDate: "2026-11-17",
    });
    mocked.create.mockResolvedValue({
      id: 8,
      projectId: 1,
      taskTypeId: 2,
      workStatusId: 3,
      ticket: null,
      startTime: "08:00",
      startMinute: 480,
      durationMinutes: 60,
      summary: "Menyelesaikan fitur.",
      obstacle: null,
    });
    mocked.delete.mockResolvedValue(undefined);
  });

  it("shows mapped save field errors in the form without a separate alert dialog", async () => {
    mocked.create.mockRejectedValueOnce(
      new ApiError(400, "Permintaan tidak valid.", { projectId: "Proyek sudah tidak aktif." }),
    );
    const user = await renderShowcase();

    await user.click(screen.getByRole("button", { name: "+ Tambah task" }));
    await screen.findByRole("dialog", { name: "Tambah Task" });
    await user.click(screen.getByRole("button", { name: "Alpha" }));
    await user.click(screen.getByRole("button", { name: "Development" }));
    await user.selectOptions(screen.getByRole("combobox"), "60");
    await user.type(screen.getByRole("textbox", { name: /Ringkasan dan hasil/ }), "Menyelesaikan fitur");
    await user.click(screen.getByRole("button", { name: "Simpan task" }));

    expect(await screen.findByRole("button", { name: "Proyek: Proyek sudah tidak aktif." })).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(document.activeElement).toHaveAttribute("id", "task-project-field");
  });

  it("shows a general ApiError message in the form summary", async () => {
    mocked.create.mockRejectedValueOnce(new ApiError(503, "Server belum dapat menyimpan task."));
    const user = await renderShowcase();

    await user.click(screen.getByRole("button", { name: "+ Tambah task" }));
    await screen.findByRole("dialog", { name: "Tambah Task" });
    await user.click(screen.getByRole("button", { name: "Alpha" }));
    await user.click(screen.getByRole("button", { name: "Development" }));
    await user.selectOptions(screen.getByRole("combobox"), "60");
    await user.type(screen.getByRole("textbox", { name: /Ringkasan dan hasil/ }), "Menyelesaikan fitur");
    await user.click(screen.getByRole("button", { name: "Simpan task" }));

    expect(await screen.findByText("Server belum dapat menyimpan task.", {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("keeps the confirmation open after a delete error and allows retry", async () => {
    mocked.delete
      .mockRejectedValueOnce(new ApiError(500, "Task belum dapat dihapus."))
      .mockResolvedValueOnce(undefined);
    const user = await renderShowcase();

    await user.click(screen.getByRole("button", { name: "Hapus" }));
    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Hapus task" }));

    expect(await within(dialog).findByText("Task belum dapat dihapus.")).toBeInTheDocument();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Hapus task" }));

    await waitFor(() => expect(mocked.delete).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("closes the confirmation after a successful delete", async () => {
    const user = await renderShowcase();

    await user.click(screen.getByRole("button", { name: "Hapus" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Hapus task" }));

    await waitFor(() => expect(mocked.delete).toHaveBeenCalledWith(7));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });
});
