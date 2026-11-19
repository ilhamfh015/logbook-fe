import { apiFetch } from "@/services/apiClient";

export type UserSettingsApi = {
  workStart: string;
  workEnd: string;
  onboarded: boolean;
  /**
   * Hari aktif menurut jam kerja server. Pada shift malam yang melewati tengah
   * malam, nilainya masih tanggal mulai shift sampai jam kerja berakhir.
   */
  activeDate: string | null;
};

export type UserSettingsUpdate = {
  workStart?: string;
  workEnd?: string;
  onboarded?: boolean;
};

export const settingsService = {
  getSettings: () => apiFetch<UserSettingsApi>("/api/settings"),

  updateSettings: (update: UserSettingsUpdate) =>
    apiFetch<UserSettingsApi>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(update),
    }),
};
