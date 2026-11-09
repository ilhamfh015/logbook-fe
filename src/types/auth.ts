export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  jenis: string | null;
  emailAtasan: string | null;
  admin: boolean;
  mustChangePassword: boolean;
};
