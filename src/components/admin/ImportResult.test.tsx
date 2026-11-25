import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ImportResult } from "@/components/admin/ImportResult";

describe("ImportResult", () => {
  it("menampilkan jumlah hasil dan email pengguna yang diimpor", async () => {
    const onFinish = vi.fn();
    const emails = ["rina.talent@contoh.id", "admin1@contoh.id"];

    render(
      <ImportResult
        created={2}
        updated={1}
        importedEmails={emails}
        onFinish={onFinish}
      />,
    );

    expect(screen.getByText("Pengguna baru")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Diperbarui")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Email pengguna hasil impor" }),
    ).toBeInTheDocument();
    expect(screen.getByText(emails[0])).toBeInTheDocument();
    expect(screen.getByText(emails[1])).toBeInTheDocument();
    expect(
      screen.getByText(/kata sandi sementara berasal dari kolom password/i),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Selesai" }));
    expect(onFinish).toHaveBeenCalledOnce();
  });

  it("tidak error ketika importedEmails tidak ada", () => {
    render(
      <ImportResult
        created={0}
        updated={3}
        importedEmails={undefined}
        onFinish={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Tidak ada email pengguna baru yang perlu ditampilkan."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
