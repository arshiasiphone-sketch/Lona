import { useAuth } from "@/hooks/use-auth";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import {
  AuthGateFallback,
  AuthGateSpinner,
  useAuthStuckGuard,
} from "@/components/AuthGateFallback";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const timedOut = useAuthStuckGuard(isLoading);
  const returnTo = `${location.pathname}${location.search}`;

  if (isLoading) {
    // Never spin forever: stale sessions are auto-recovered (see the
    // guard), and a healthy-but-unreachable session gets a retry UI.
    return timedOut ? <AuthGateFallback returnTo={returnTo} /> : <AuthGateSpinner />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/auth?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  return children;
}
