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
import { Loader2 } from "lucide-react";

interface RequireRoleProps {
  permission?: AdminPermission;
}

export function RequireRole({ permission }: RequireRoleProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <Loader2 className="h-5 w-5 animate-spin text-ink-soft" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?returnTo=${returnTo}`} replace />;
  }

  if (permission && !hasPermission(user.role, permission)) {
    // Don't leak that the route exists.
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
