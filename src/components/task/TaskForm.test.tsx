import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskForm } from "@/components/task/TaskForm";
import type { TaskDraft } from "@/types/task";

function renderTaskForm(onSave: (task: TaskDraft) => Promise<void> = vi.fn(async () => undefined)) {
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
      durations={[{ minutes: 30, label: "30 m" }]}
      loading={false}
      saving={false}
    />,
  );

  return { user, onSave, onCancel };
}

describe("TaskForm", () => {
  it("shows required-field errors and does not save an incomplete task", async () => {
    const { user, onSave } = renderTaskForm();

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
});
