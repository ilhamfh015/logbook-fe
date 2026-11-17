import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorNotice } from "@/components/shared/ErrorNotice";
import type { ErrorItem } from "@/lib/errorItems";

const items: ErrorItem[] = [
  { id: "error-project", message: "Proyek: Pilihan tidak tersedia.", field: "project", source: "server" },
  { id: "error-general", message: "Data belum dapat disimpan.", source: "server" },
];

describe("ErrorNotice", () => {
  it("renders nothing when there are no items", () => {
    const { container } = render(<ErrorNotice items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the title and every item in a summary", () => {
    render(<ErrorNotice items={items} title="Periksa data" />);

    expect(screen.getByRole("heading", { name: "Periksa data" })).toBeInTheDocument();
    expect(screen.getByText(items[0].message)).toBeInTheDocument();
    expect(screen.getByText(items[1].message)).toBeInTheDocument();
  });

  it("calls onSelectField with the selected field", async () => {
    const user = userEvent.setup();
    const onSelectField = vi.fn();
    render(<ErrorNotice items={items} onSelectField={onSelectField} />);

    await user.click(screen.getByRole("button", { name: items[0].message }));

    expect(onSelectField).toHaveBeenCalledWith("project");
  });

  it("renders general items as text rather than buttons", () => {
    render(<ErrorNotice items={[items[1]]} onSelectField={vi.fn()} />);

    expect(screen.getByText(items[1].message).tagName).not.toBe("BUTTON");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("exposes an assertive alert with the shared red error palette", () => {
    const { container } = render(<ErrorNotice items={items} />);
    const alert = screen.getByRole("alert");

    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveAttribute("tabindex", "-1");
    expect(alert).toHaveClass("border-red-200", "bg-red-50", "text-red-700");
    expect(container.querySelector("svg")).toHaveClass("text-red-700");
    expect(screen.getByRole("heading")).toHaveClass("text-red-700");
    expect(screen.getByRole("list")).toHaveClass("text-red-700");
  });

  it("shows only the first message in banner variant", () => {
    render(<ErrorNotice items={items} variant="banner" />);

    expect(screen.getByText(items[0].message)).toBeInTheDocument();
    expect(screen.queryByText(items[1].message)).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});