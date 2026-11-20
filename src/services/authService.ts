
import { apiFetch } from "@/services/apiClient";
import type {
  AuthApiResponse,
  AuthUser,
  UserRole,
  UserRoles,
} from "@/types/auth";

type AuthApiResponseWithRoles = AuthApiResponse & {
  roles?: UserRole[];
};

function mapAuthUser(data: AuthApiResponseWithRoles): AuthUser {
  return {
    id: data.id,
    email: data.email,
    fullName: data.fullName,
    jenis: data.jenis,
    emailAtasan: data.emailAtasan,
    admin: data.admin,
    mustChangePassword: data.mustChangePassword,
    isActive: data.isActive ?? data.is_active,
    roles: data.roles ?? [],
  };
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthUser> => {
    const response = await apiFetch<AuthApiResponseWithRoles>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );

    return mapAuthUser(response);
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<AuthUser> => {
    const response = await apiFetch<AuthApiResponseWithRoles>(
      "/api/auth/change-password",
      {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      }
    );

    return mapAuthUser(response);
  },

  me: async (): Promise<AuthUser> => {
    const response = await apiFetch<AuthApiResponseWithRoles>(
      "/api/auth/me"
    );

    return mapAuthUser(response);
  },

  roles: () => apiFetch<UserRoles>("/api/auth/roles"),

  logout: () =>
    apiFetch<void>("/api/auth/logout", {
      method: "POST",
    }),
};
