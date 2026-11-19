import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsPageContent } from "@/components/settings/SettingsPageContent";
import { settingsService, type UserSettingsApi } from "@/services/settingsService";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({
    user: { fullName: "Rina", email: "rina@contoh.id", roles: ["TALENT"] },
    loading: false,
  }),
}));

vi.mock("@/services/settingsService", () => ({
  settingsService: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

const initialSettings: UserSettingsApi = {
  workStart: "08:00",
  workEnd: "17:00",
  onboarded: false,
  activeDate: "2026-11-19",
};

describe("SettingsPageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(settingsService.getSettings).mockResolvedValue(initialSettings);
    vi.mocked(settingsService.updateSettings).mockImplementation(
      async (update) => ({ ...initialSettings, ...update }),
    );
  });

  it("menampilkan pengaturan yang dimuat dari API", async () => {
    render(<SettingsPageContent />);

    await waitFor(() => {
      expect(screen.getByLabelText("Jam mulai")).toHaveValue("08:00");
      expect(screen.getByLabelText("Jam selesai")).toHaveValue("17:00");
    });
    expect(screen.getByText("08:00 – 17:00")).toBeInTheDocument();
    expect(screen.getByText("Belum dilihat")).toBeInTheDocument();
  });

  it("menyimpan jam kerja dan status panduan melalui PUT", async () => {
    const user = userEvent.setup();
    render(<SettingsPageContent />);

    await waitFor(() => expect(screen.getByLabelText("Jam mulai")).toHaveValue("08:00"));

    fireEvent.change(screen.getByLabelText("Jam mulai"), { target: { value: "13:00" } });
    fireEvent.change(screen.getByLabelText("Jam selesai"), { target: { value: "22:00" } });
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Simpan pengaturan" }));

    await waitFor(() => {
      expect(settingsService.updateSettings).toHaveBeenCalledWith({
        workStart: "13:00",
        workEnd: "22:00",
        onboarded: true,
      });
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Pengaturan berhasil disimpan.");
  });

  it("menampilkan catatan untuk shift malam", async () => {
    render(<SettingsPageContent />);

    await waitFor(() => expect(screen.getByLabelText("Jam mulai")).toHaveValue("08:00"));
    fireEvent.change(screen.getByLabelText("Jam mulai"), { target: { value: "22:00" } });
    fireEvent.change(screen.getByLabelText("Jam selesai"), { target: { value: "06:00" } });

    expect(screen.getByText(/Shift malam terdeteksi/)).toBeInTheDocument();
  });
});
