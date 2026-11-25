import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TeamDashboard } from "@/components/atasan/TeamDashboard";

describe("TeamDashboard", () => {
  it("menampilkan ringkasan tim dan data anggota mock", () => {
    render(<TeamDashboard />);

    expect(screen.getByRole("heading", { name: "Tim" })).toBeInTheDocument();
    expect(screen.getByText("Selasa, 10 Nov 2026")).toBeInTheDocument();

    expect(screen.getByText("Anggota tim")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Menunggu keputusan")).toBeInTheDocument();
    expect(screen.getByText("5 hari")).toBeInTheDocument();
    expect(screen.getByText("Perbaikan diajukan")).toBeInTheDocument();

    expect(screen.getByText("Rina Aulia")).toBeInTheDocument();
    expect(screen.getByText("Sari Wulandari")).toBeInTheDocument();
    expect(screen.getByText("Dedi Pratama")).toBeInTheDocument();

    expect(screen.getByText("Data demonstrasi berdasarkan mockup, belum terhubung ke API.")).toBeInTheDocument();
  });

  it("menonaktifkan aksi buka karena detail C4 belum tersedia", () => {
    render(<TeamDashboard />);

    const openButtons = screen.getAllByRole("button", { name: "Buka" });
    expect(openButtons).toHaveLength(5);
    for (const button of openButtons) {
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("title", "Detail C4 belum termasuk cakupan pekerjaan ini");
    }
  });

  it("mengubah tanggal saat navigasi hari diklik", async () => {
    const user = userEvent.setup();
    render(<TeamDashboard />);

    expect(screen.getByText("Selasa, 10 Nov 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hari berikutnya" }));
    expect(screen.getByText("Rabu, 11 Nov 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hari sebelumnya" }));
    expect(screen.getByText("Selasa, 10 Nov 2026")).toBeInTheDocument();
  });

  it("menampilkan kartu cuti/libur hari ini sesuai data mock", () => {
    render(<TeamDashboard />);

    const leaveCard = screen.getByText("Cuti atau libur hari ini").closest("article");
    expect(leaveCard).not.toBeNull();
    expect(within(leaveCard!).getByText("1")).toBeInTheDocument();
  });
});
