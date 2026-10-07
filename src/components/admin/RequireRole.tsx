/**
 * Phase 5 — Role-protected route wrapper.
 *
 * Composition:
 *   • Reads `useAuth().user.role` from the existing auth flow.
 *   • When the role is loading or missing, redirects to /auth.
 *   • When the resolved role is below the required permission,
 *     redirects to the storefront / (instead of leaking admin UI).
 *
 * The actual authorization decision lives on the Convex server
 * (`requirePermission` in `convex/admin.ts`). This wrapper is a UX
 * nicety — it hides nav links and routing, but the server is still
 * authoritative for every mutation.
 */
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission, type AdminPermission } from "@/lib/data/permissions";
import {
  AuthGateFallback,
  AuthGateSpinner,
  useAuthStuckGuard,
} from "@/components/AuthGateFallback";

interface RequireRoleProps {
  permission?: AdminPermission;
}

export function RequireRole({ permission }: RequireRoleProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const timedOut = useAuthStuckGuard(isLoading);
  const returnTo = location.pathname + location.search;

  if (isLoading) {
    return timedOut ? (
      <AuthGateFallback returnTo={returnTo} />
    ) : (
      <AuthGateSpinner />
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={`/auth?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  if (user.adminStatus === "disabled") {
    return <Navigate to="/" replace />;
  }

  if (permission && !hasPermission(user.role, permission, user.adminPermissions)) {
    // Don't leak that the route exists.
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
