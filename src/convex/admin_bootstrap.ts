/**
 * Phase 8.4 — Secure first-owner bootstrap.
 *
 * The first owner is claimed by a secret-gated internal action using an
 * explicit email. There is no public email-promotion mutation.
 */
import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireOwner } from "./admin";

export const claimOwner = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error("INVALID_EMAIL");
    }
    const current = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .unique();
    if (!current) throw new Error("OWNER_EMAIL_NOT_FOUND");

    const privileged = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(q.eq(q.field("role"), "owner"), q.eq(q.field("role"), "admin")),
      )
      .collect();
    if (privileged.length > 0) throw new Error("ADMIN_BOOTSTRAP_ALREADY_STARTED");

    await ctx.db.patch(current._id, {
      role: "owner",
      adminStatus: "active",
      lastLoginAt: Date.now(),
    });
    return { id: current._id, role: "owner" as const };
  },
});

/** Safe diagnostic; role/email are returned only to the signed-in caller. */
export const status = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { signedIn: false as const, role: null };
    const me = await ctx.db.get(userId);
    return {
      signedIn: true as const,
      role: me?.role ?? null,
      email: me?.email ?? null,
      ownerExists:
        (await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("role"), "owner"))
          .first()) !== null,
    };
  },
});

/** Owner-only team listing. */
export const listAdmins = query({
  args: {},
  handler: async (ctx) => {
    await requireOwner(ctx);
    const users = await ctx.db.query("users").collect();
    return users
      .filter((user) =>
        user.role === "owner" ||
        user.role === "admin" ||
        user.role === "manager" ||
        user.role === "editor" ||
        user.role === "support",
      )
      .map((user) => ({
        id: user._id,
        email: user.email ?? "",
        name: user.name ?? "",
        role: user.role,
        adminStatus: user.adminStatus ?? "active",
        createdAt: user._creationTime,
        lastLoginAt: user.lastLoginAt,
      }));
  },
});
