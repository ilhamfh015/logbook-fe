import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OnboardingWizard from "@/components/settings/OnboardingWizard";
import { settingsService } from "@/services/settingsService";

vi.mock("@/services/settingsService", () => ({
  settingsService: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

describe("OnboardingWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("menampilkan langkah awal panduan", () => {
    render(<OnboardingWizard />);

    expect(screen.getByText("Selamat datang di Log Book!")).toBeInTheDocument();
    expect(screen.getByText("Langkah 1 dari 3")).toBeInTheDocument();
  });

  it("berpindah ke langkah pengaturan jam kerja", () => {
    render(<OnboardingWizard />);

    fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));

    expect(screen.getByText("Atur jam kerja")).toBeInTheDocument();
    expect(screen.getByText("Langkah 2 dari 3")).toBeInTheDocument();
  });

  it("kembali ke langkah sebelumnya", () => {
    render(<OnboardingWizard />);

    fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));
    fireEvent.click(screen.getByRole("button", { name: /kembali/i }));

    expect(screen.getByText("Selamat datang di Log Book!")).toBeInTheDocument();
  });

  it("berpindah ke langkah konfirmasi", () => {
    render(<OnboardingWizard />);

    fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));
    fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));

    expect(screen.getByText("Pengaturan Anda sudah siap")).toBeInTheDocument();
    expect(screen.getByText("Langkah 3 dari 3")).toBeInTheDocument();
  });

  it("menyimpan pengaturan dan memanggil onComplete", async () => {
    const onComplete = vi.fn();
    vi.mocked(settingsService.updateSettings).mockResolvedValue({
      workStart: "08:00",
      workEnd: "17:00",
      onboarded: true,
      activeDate: null,
    });

    render(<OnboardingWizard onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));
    fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));
    fireEvent.click(screen.getByRole("button", { name: /selesai/i }));

    await waitFor(() => {
      expect(settingsService.updateSettings).toHaveBeenCalledWith({
        workStart: "08:00",
        workEnd: "17:00",
        onboarded: true,
      });
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it("menampilkan pesan error jika penyimpanan gagal", async () => {
    vi.mocked(settingsService.updateSettings).mockRejectedValue(
      new Error("Gagal menyimpan"),
    );

    render(<OnboardingWizard />);

    fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));
    fireEvent.click(screen.getByRole("button", { name: /lanjut/i }));
    fireEvent.click(screen.getByRole("button", { name: /selesai/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Pengaturan belum berhasil disimpan. Silakan coba lagi.",
        ),
      ).toBeInTheDocument();
    });
  });
});
