
export type UserRole = "TALENT" | "ATASAN" | "ADMIN";

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  jenis: string | null;
  emailAtasan: string | null;
  admin: boolean;
  mustChangePassword: boolean;
  roles: UserRole[];
  isActive?: boolean;
};

export type UserRoles = {
  userId: number;
  email: string;
  fullName: string;
  roles: UserRole[];
  talent: boolean;
  atasan: boolean;
  admin: boolean;
  emailAtasan: string | null;
  teamSize: number;
};

export type AuthApiResponse = {
  id: number;
  email: string;
  fullName: string;
  jenis: string | null;
  emailAtasan: string | null;
  admin: boolean;
  mustChangePassword: boolean;
  isActive?: boolean;
  is_active?: boolean;
};
