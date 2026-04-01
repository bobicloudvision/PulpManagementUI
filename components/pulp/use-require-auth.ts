"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

type UseRequireAuthInput = {
  hasSession: boolean;
  isCheckingSession: boolean;
};

export function useRequireAuth({ hasSession, isCheckingSession }: UseRequireAuthInput) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isCheckingSession || hasSession) {
      return;
    }

    const next = encodeURIComponent(pathname || "/users/list");
    router.replace(`/login?next=${next}`);
  }, [hasSession, isCheckingSession, pathname, router]);

  return !isCheckingSession && !hasSession;
}
