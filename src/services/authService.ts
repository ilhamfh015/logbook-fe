import { apiFetch } from "@/services/apiClient";
import type { AuthUser } from "@/types/auth";

export const authService = {
  login: (email: string) =>
    apiFetch<AuthUser>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  me: () => apiFetch<AuthUser>("/api/auth/me"),

  logout: () => apiFetch<void>("/api/auth/logout", { method: "POST" }),
};
