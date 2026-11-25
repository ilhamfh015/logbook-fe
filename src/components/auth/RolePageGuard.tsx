"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { canAccessReviewPage, canAccessTeamPage } from "@/lib/rolePermissions";

type RolePageGuardProps = {
  access: "team" | "review";
  children: ReactNode;
};

export function RolePageGuard({ access, children }: RolePageGuardProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const allowed = access === "team"
    ? canAccessTeamPage(user?.roles)
    : canAccessReviewPage(user?.roles);

  useEffect(() => {
    if (!loading && user && !allowed) router.replace("/");
  }, [allowed, loading, router, user]);

  if (!loading && user && allowed) return children;

  return (
    <main className="min-h-screen bg-surface px-5 py-12 text-ink">
      <p className="mx-auto max-w-3xl text-sm text-slate-600" role="status">
        Memeriksa akses...
      </p>
    </main>
  );
}