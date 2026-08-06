/**
 * Server-side helpers used by every Convex handler.
 *
 *   • `requireUser` / `requireAdmin` — RBAC primitives.
 *   • `cartSessionId` — resolves a deterministic session token for the
 *     shop context that survives sign-in (so anonymous and auth carts
 *     can be merged into one row). Anonymous device tokens are minted
 *     client-side and persisted via the FE session-store.
 *   • `mergeCartLines` — pure helper that combines anonymous + auth
 *     cart arrays by `(productId, size, color)` key.
 *
 * We deliberately avoid the `convex-helpers` package to keep the
 * surface area tight; instead, every domain handler that needs the
 * signed-in user calls `requireUser(ctx)` at the top of its body
 * and reads `user._id` from the return value.
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export type Ctx = QueryCtx | MutationCtx | ActionCtx;

/**
 * Throws unless the request is signed in. Returns the user doc.
 */
export async function requireUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const userId = await getAuthUserId(ctx as QueryCtx);
  if (!userId) {
    throw new Error("UNAUTHORIZED: sign-in required");
  }
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("UNAUTHORIZED: user record missing");
  }
  if (user.adminStatus === "disabled") {
    throw new Error("FORBIDDEN: admin account disabled");
  }
  return user;
}

/**
 * Throws unless the request is signed in AND has role === "admin".
 */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.role !== "admin" && user.role !== "owner") {
    throw new Error("FORBIDDEN: admin role required");
  }
  return user;
}

/**
 * Merge two cart line arrays by (productId, size, color). The merge
 * preserves `addedAt` from the earlier line and sums `quantity`.
 *
 * `productId` is an opaque string (the FE uses catalog ids like
 * "p-001"; a future migration can switch to Convex `_id` without
 * breaking this helper).
 */
export function mergeCartLines<
  L extends {
    productId: string;
    size: string;
    color: string;
    quantity: number;
  },
>(a: L[], b: L[]): L[] {
  const map = new Map<string, L>();
  for (const line of [...a, ...b]) {
    const key = `${line.productId}|${line.size}|${line.color}`;
    const existing = map.get(key);
    if (existing) {
      map.set(key, { ...existing, quantity: existing.quantity + line.quantity });
    } else {
      map.set(key, line);
    }
  }
  return [...map.values()];
}

/**
 * Choose a stable client session token. Until the device resolves a
 * signed-in user, this is a UUID-ish string persisted in localStorage.
 * Once auth lands, the cart merges and uses `"u:<userId>"` instead.
 */
export function cartSessionId(
  userId: Id<"users"> | null | undefined,
  deviceToken: string
): string {
  return userId ? `u:${userId}` : `g:${deviceToken}`;
}
