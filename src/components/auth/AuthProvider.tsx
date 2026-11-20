"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import type { AuthUser } from "@/types/auth";

export const CHANGE_PASSWORD_PATH = "/change-password";

const LOGIN_PATH = "/login";
const HOME_PATH = "/";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    authService
      .me()
      .then((current) => {
        if (mounted) setUser(current);
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (pathname !== LOGIN_PATH) router.replace(LOGIN_PATH);
      return;
    }

    if (user.mustChangePassword && pathname !== CHANGE_PASSWORD_PATH) {
      router.replace(CHANGE_PASSWORD_PATH);
      return;
    }

    if (!user.mustChangePassword && pathname === CHANGE_PASSWORD_PATH) {
      router.replace(HOME_PATH);
    }
  }, [loading, user, pathname, router]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      router.replace(LOGIN_PATH);
    };

    const handlePasswordChangeRequired = () => {
      setUser((current) => (
        current && !current.mustChangePassword
          ? { ...current, mustChangePassword: true }
          : current
      ));
      router.replace(CHANGE_PASSWORD_PATH);
    };

    window.addEventListener("logbook:unauthorized", handleUnauthorized);
    window.addEventListener("logbook:password-change-required", handlePasswordChangeRequired);

    return () => {
      window.removeEventListener("logbook:unauthorized", handleUnauthorized);
      window.removeEventListener("logbook:password-change-required", handlePasswordChangeRequired);
    };
  }, [router]);

  const login = useCallback(async (email: string, password: string) => {
    const current = await authService.login(email, password);
    setUser(current);
    return current;
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const current = await authService.changePassword(currentPassword, newPassword);
    setUser(current);
    return current;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      router.replace(LOGIN_PATH);
    }
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, login, changePassword, logout }),
    [user, loading, login, changePassword, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider");
  }

  return context;
}
