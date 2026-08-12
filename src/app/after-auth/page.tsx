"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ensureRoleMetadata } from "@/lib/auth/ensure-role";
import { getRoleHome, isUserRole } from "@/lib/auth/roles";

export default function AfterAuthPage() {
  const { isLoaded, userId, getToken } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const [message, setMessage] = useState("Finishing sign-in…");

  useEffect(() => {
    if (!isLoaded || !isUserLoaded) return;

    if (!userId) {
      router.replace("/sign-in");
      return;
    }

    let cancelled = false;

    async function finish() {
      const role = await ensureRoleMetadata();

      if (cancelled) return;

      if (!role) {
        setMessage(
          "Your account does not have a role yet. Workers and employers should sign up again and select a role. Admin accounts must be provisioned by Pinnacle staff.",
        );
        return;
      }

      await user?.reload();
      await getToken({ skipCache: true });

      if (cancelled) return;

      const confirmed =
        (isUserRole(user?.publicMetadata?.role)
          ? user?.publicMetadata?.role
          : null) ?? role;

      router.replace(getRoleHome(confirmed));
    }

    void finish();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isUserLoaded, router, user, userId]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-4">
      <h1 className="font-display text-2xl font-bold text-ink">Pinnacle</h1>
      <p className="max-w-md text-center text-sm text-graphite">{message}</p>
    </main>
  );
}
