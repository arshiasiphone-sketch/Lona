/**
 * Phase 5 — Enterprise Admin Dashboard. Role & permission primitives.
 *
 * The RBAC model keeps legacy `requireUser` / `requireAdmin` (in
 * `_helpers.ts`) intact so Phase 4 customer flows remain untouched.
 * Admin-only mutations call `assertPermission(ctx, "manage_products")`
 * etc.; the role → permission mapping lives in one place here so it
 * can be tuned without re-touching every admin domain file.
 */
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc } from "./_generated/dataModel";
import { adminPermissionLiterals, type AdminPermission } from "./validators";

/** Default role assigned to a fresh signup when one wasn't set. */
export const DEFAULT_ROLE: Doc<"users">["role"] = "user";

/**
 * Permission matrix. Tiered so a higher role inherits everything
 * below it. Owner / admin get full access; manager gets everything
 * below them; editor handles content; support handles customers.
 *
 * Owners are reserved for the future multi-brand hierarchy and the
 * admin dashboard treats them as the highest tier (above admin).
 */
const PERMISSIONS: Record<NonNullable<Doc<"users">["role"]>, ReadonlySet<AdminPermission>> = {
  owner: new Set<AdminPermission>(adminPermissionLiterals),
  admin: new Set<AdminPermission>(adminPermissionLiterals),
  manager: new Set<AdminPermission>([
    "manage_products",
    "manage_inventory",
    "manage_orders",
    "manage_customers",
    "manage_content",
    "manage_coupons",
    "manage_media",
    "view_reports",
  ]),
  editor: new Set<AdminPermission>([
    "manage_products",
    "manage_content",
    "manage_media",
  ]),
  support: new Set<AdminPermission>([
    "manage_customers",
  ]),
  // Phase 4 customer roles — no admin permissions.
  member: new Set<AdminPermission>(),
  user: new Set<AdminPermission>(),
};

export function hasPermission(
  role: Doc<"users">["role"] | null | undefined,
  permission: AdminPermission,
): boolean {
  if (!role) return false;
  return PERMISSIONS[role]?.has(permission) ?? false;
}

export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  permission: AdminPermission,
): Promise<Doc<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("UNAUTHORIZED");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("UNAUTHORIZED");
  if (!hasPermission(user.role, permission)) {
    throw new Error(`FORBIDDEN:${permission}`);
  }
  return user;
}

/**
 * Lightweight write-only audit logger. We fire-and-forget these into
 * the existing `activity_logs` table so a future Activity viewer can
 * chart every admin write without changing the table schema again.
 */
export async function audit(
  ctx: MutationCtx,
  actor: Doc<"users">,
  action: string,
  resource: string,
  resourceId?: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  await ctx.db.insert("activity_logs", {
    userId: actor._id,
    action,
    resource,
    resourceId,
    payload,
    at: Date.now(),
  });
}
