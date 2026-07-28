/**
 * Phase 5.1 — First-time admin bootstrap.
 *
 * The auth surface is email + OTP (no passwords), so the very first
 * admin has to be created without anyone being signed in yet. This
 * mutation is intentionally unauthenticated AND self-locking: it
 * succeeds only when **no** admin or owner row currently exists. As
 * soon as the first admin lands, the path closes and admin mutations
 * fall back to the normal `requirePermission` gate.
 *
 * Usage from the project terminal:
 *   bun convex run admin_bootstrap:promote '{"email":"you@example.com"}'
 *   bun convex run admin_bootstrap:promote '{"email":"you@example.com","role":"owner"}'
 *
 * If the user record doesn't exist yet (typical first run), the
 * mutation also accepts an optional `name` and writes a placeholder
 * row so the role has somewhere to land. The user must still run
 * the OTP sign-in flow at `/auth` once to claim the profile.
 *
 * SECURITY NOTE: this is a development-grade bootstrap. Before
 * shipping to production, swap the unauthenticated `promote` for a
 * one-time CLI-only seed or a server-side env-gated allowlist.
 */
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { vRole } from "./validators";
import { getAuthUserId } from "@convex-dev/auth/server";

export const promote = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    role: v.optional(vRole),
  },
  handler: async (ctx, args) => {
    // Defensive: refuse if any admin or owner already exists. Once
    // the first admin is in place, every future promotion has to go
    // through the admin surface (server-side `requirePermission`).
    const admins = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(q.eq(q.field("role"), "admin"), q.eq(q.field("role"), "owner")),
      )
      .collect();
    if (admins.length > 0) {
      throw new Error("BOOTSTRAPPED");
    }

    // Locate the target user by email. If none exists yet, mint a
    // placeholder so the role has somewhere to land.
    const lowered = args.email.trim().toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", lowered))
      .unique();
    const role = args.role ?? "admin";

    if (existing) {
      await ctx.db.patch(existing._id, { role });
      return { id: existing._id, role, created: false };
    }

    const id = await ctx.db.insert("users", {
      email: lowered,
      name: args.name,
      role,
      isAnonymous: false,
    });
    return { id, role, created: true };
  },
});

/**
 * One-shot companion used by the seed runner only. Returns the
 * caller to `/auth` flow once an admin/owner exists.
 */
export const status = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { signedIn: false };
    const me = await ctx.db.get(userId);
    return {
      signedIn: true,
      role: me?.role ?? null,
      email: me?.email ?? null,
    };
  },
});
