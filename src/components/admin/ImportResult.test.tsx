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

  it("menampilkan hasil validasi per baris termasuk baris yang gagal", () => {
    render(
      <ImportResult
        created={1}
        updated={1}
        importedEmails={["rina@contoh.id"]}
        rows={[
          {
            rowNumber: 2,
            email: "rina@contoh.id",
            status: "created",
            message: "Pengguna berhasil dibuat",
          },
          {
            rowNumber: 3,
            email: "admin@contoh.id",
            status: "updated",
            message: "Pengguna berhasil diperbarui",
          },
          {
            rowNumber: 4,
            email: "invalid-email",
            status: "failed",
            message: "Format email tidak valid",
          },
        ]}
        onFinish={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Hasil validasi per baris" }),
    ).toBeInTheDocument();

    expect(screen.getByText("Baris 2")).toBeInTheDocument();
    expect(screen.getAllByText("rina@contoh.id")).toHaveLength(2);
    expect(screen.getByText("Berhasil dibuat")).toBeInTheDocument();
    expect(screen.getByText("Pengguna berhasil dibuat")).toBeInTheDocument();

    expect(screen.getByText("Baris 3")).toBeInTheDocument();
    expect(screen.getByText("Berhasil diperbarui")).toBeInTheDocument();
    expect(
      screen.getByText("Pengguna berhasil diperbarui"),
    ).toBeInTheDocument();

    expect(screen.getByText("Baris 4")).toBeInTheDocument();
    expect(screen.getByText("invalid-email")).toBeInTheDocument();
    expect(screen.getByText("Gagal")).toBeInTheDocument();
    expect(screen.getByText("Format email tidak valid")).toBeInTheDocument();
  });
});
