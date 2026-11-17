import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskForm } from "@/components/task/TaskForm";
import type { TaskDraft } from "@/types/task";

type TaskFormProps = Parameters<typeof TaskForm>[0];

function renderTaskForm(
  onSave: (task: TaskDraft) => Promise<void> = vi.fn(async () => undefined),
  props: Partial<TaskFormProps> = {},
) {
  const user = userEvent.setup();
  const onCancel = vi.fn();

  render(
    <TaskForm
      onCancel={onCancel}
      onSave={onSave}
      projects={[
        { project_id: 1, project_name: "Alpha", client_name: "Client A", color: "blue" },
      ]}
      taskTypes={[{ id: 2, name: "Development" }]}
      workStatuses={[{ id: 3, name: "Berjalan" }]}
      durations={[
        { minutes: 30, label: "30 m" },
        { minutes: 60, label: "1 j" },
      ]}
      loading={false}
      saving={false}
      {...props}
    />,
  );

  return { user, onSave, onCancel };
}

describe("TaskForm", () => {
  it("shows required-field errors and does not save an incomplete task", async () => {
    const { user, onSave } = renderTaskForm();

    expect(screen.getByText("Pilih jenis task yang tersedia.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Development" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await user.click(screen.getByRole("button", { name: "Simpan task" }));

    expect(screen.getByText("Proyek wajib dipilih.")).toBeInTheDocument();
    expect(screen.getByText("Durasi wajib dipilih.")).toBeInTheDocument();
    expect(screen.getByText("Ringkasan wajib diisi.")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves a valid task with the selected project, duration, and summary", async () => {
    const onSave = vi.fn(async () => undefined);
    const { user } = renderTaskForm(onSave);

    await user.click(screen.getByRole("button", { name: "Alpha" }));
    await user.click(screen.getByRole("button", { name: "Development" }));
    await user.selectOptions(screen.getByRole("combobox"), "30");
    await user.type(screen.getByRole("textbox", { name: /Ringkasan dan hasil/ }), "Menyelesaikan fitur");
    await user.click(screen.getByRole("button", { name: "Simpan task" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      projectId: 1,
      taskTypeId: 2,
      workStatusId: 3,
      startTime: "08:00",
      durationMinutes: 30,
      summary: "Menyelesaikan fitur",
    }));
  });

  it("shows a ticket-format error while the value is invalid", async () => {
    const { user, onSave } = renderTaskForm();

    await user.type(screen.getByRole("textbox", { name: /Tiket/ }), "invalid-ticket");

    expect(screen.getByText("Format tiket tidak valid. Contoh: ABC-154")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("warns about after-hours tasks without blocking save", async () => {
    const onSave = vi.fn(async () => undefined);
    const { user } = renderTaskForm(onSave);

    await user.click(screen.getByRole("button", { name: "Alpha" }));
    await user.click(screen.getByRole("button", { name: "Development" }));
    fireEvent.change(screen.getByLabelText(/Mulai/), {
      target: { value: "18:00" },
    });
    await user.selectOptions(screen.getByRole("combobox"), "60");
    await user.type(
      screen.getByRole("textbox", { name: /Ringkasan dan hasil/ }),
      "Menyelesaikan fitur",
    );

    expect(
      screen.getByText(/di luar jam kerja normal \(08\.00–17\.00\)/),
    ).toHaveClass("bg-amber-50");
    expect(onSave).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Simpan task" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ startTime: "18:00", durationMinutes: 60 }),
    );
  });

  it("fills project, ticket, and type from a continue suggestion", async () => {
    const { user } = renderTaskForm(undefined, {
      continueTasks: [
        {
          id: 14,
          project: "Alpha",
          color: "#1565C0",
          ticket: "ABC-142",
          startMinute: 480,
          durationMinutes: 60,
          type: "Development",
          summary: "Validasi form pendaftaran.",
          workStatus: "Berjalan",
          obstacle: null,
        },
      ],
    });

    expect(screen.getByLabelText("Lanjutkan pekerjaan")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Lanjutkan ABC-142" }));

    expect(screen.getByRole("textbox", { name: /Tiket/ })).toHaveValue("ABC-142");
    expect(screen.getByRole("button", { name: "Alpha" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Development" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("hides continue suggestions while editing an existing task", () => {
    renderTaskForm(undefined, {
      initialTask: {
        id: "7",
        projectId: 1,
        taskTypeId: 2,
        workStatusId: 3,
        project: "Alpha",
        projectColor: "blue",
        ticket: "ABC-142",
        startTime: "08:00",
        durationMinutes: 60,
        type: "Development",
        summary: "Melanjutkan pekerjaan.",
        obstacle: "",
        workStatus: "BERJALAN",
      },
      continueTasks: [
        {
          id: 14,
          project: "Alpha",
          color: "#1565C0",
          ticket: "ABC-142",
          startMinute: 480,
          durationMinutes: 60,
          type: "Development",
          summary: "Validasi form pendaftaran.",
          workStatus: "Berjalan",
          obstacle: null,
        },
      ],
    });

    expect(screen.queryByLabelText("Lanjutkan pekerjaan")).not.toBeInTheDocument();
  });

  it("shows all local errors in field order, blocks saving, and focuses the first field", async () => {
    const { user, onSave } = renderTaskForm();

    await user.click(screen.getByRole("button", { name: "Simpan task" }));

    const summary = screen.getByRole("alert");
    expect(within(summary).getAllByRole("button").map((item) => item.textContent)).toEqual([
      "Proyek: Proyek wajib dipilih.",
      "Durasi: Durasi wajib dipilih.",
      "Jenis task: Pilih jenis task yang tersedia.",
      "Ringkasan: Ringkasan wajib diisi.",
    ]);
    expect(onSave).not.toHaveBeenCalled();
    expect(document.activeElement).toHaveAttribute("id", "task-project-field");
  });

  it("keeps the after-hours warning out of the error summary", async () => {
    const { user, onSave } = renderTaskForm();
    fireEvent.change(screen.getByLabelText(/Mulai/), {
      target: { value: "18:00" },
    });

    await user.click(screen.getByRole("button", { name: "Simpan task" }));

    expect(screen.getByText(/di luar jam kerja normal/)).toBeInTheDocument();
    const summary = screen.getByRole("alert");
    expect(within(summary).queryByText(/di luar jam kerja normal/)).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("focuses the matching field when a summary item is selected", async () => {
    const { user } = renderTaskForm();

    await user.click(screen.getByRole("button", { name: "Simpan task" }));
    await user.click(screen.getByRole("button", { name: "Ringkasan: Ringkasan wajib diisi." }));

    expect(document.activeElement).toHaveAttribute("id", "task-summary");
  });

  it("removes a field error from the summary after that field changes", async () => {
    const { user } = renderTaskForm();

    await user.click(screen.getByRole("button", { name: "Simpan task" }));
    await user.click(screen.getByRole("button", { name: "Alpha" }));

    expect(screen.queryByRole("button", { name: "Proyek: Proyek wajib dipilih." })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Durasi: Durasi wajib dipilih." })).toBeInTheDocument();
  });

  it("maps backend field keys to Indonesian labels and focuses the first field", async () => {
    renderTaskForm(undefined, {
      serverErrorItems: [
        { id: "error-summary", field: "summary", message: "Ringkasan: Perlu diperiksa.", source: "server" },
        { id: "error-projectId", field: "projectId", message: "Proyek: Proyek tidak tersedia.", source: "server" },
      ],
    });

    expect(await screen.findByRole("button", { name: "Proyek: Proyek tidak tersedia." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ringkasan: Perlu diperiksa." })).toBeInTheDocument();
    expect(document.activeElement).toHaveAttribute("id", "task-project-field");
  });

  it("keeps an unknown backend key as a general error and focuses the summary", async () => {
    renderTaskForm(undefined, {
      initialTask: {
        id: "7",
        projectId: 1,
        taskTypeId: 2,
        workStatusId: 3,
        project: "Alpha",
        projectColor: "blue",
        ticket: "ABC-142",
        startTime: "08:00",
        durationMinutes: 60,
        type: "Development",
        summary: "Pekerjaan selesai.",
        obstacle: "",
        workStatus: "BERJALAN",
      },
      serverErrorItems: [
        { id: "error-unexpectedField", field: "unexpectedField", message: "Data belum dapat diproses.", source: "server" },
      ],
    });

    expect(await screen.findByText("Data belum dapat diproses.")).toBeInTheDocument();
    expect(document.activeElement).toHaveAttribute("id", "task-error-summary");
    expect(screen.queryByRole("button", { name: "Data belum dapat diproses." })).not.toBeInTheDocument();
  });

  it("uses the shared red palette for the error summary", async () => {
    const { user } = renderTaskForm();

    await user.click(screen.getByRole("button", { name: "Simpan task" }));

    expect(screen.getByRole("alert")).toHaveClass("border-red-200", "bg-red-50", "text-red-700");
  });
});
