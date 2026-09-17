/**
 * Phase 8.4 — Secure first-owner bootstrap.
 *
 * The first owner is claimed by a secret-gated internal action using an
 * explicit identifier. There is no public promotion mutation.
 *
 * Phone-auth migration note
 * ─────────────────────────
 * Authentication is now phone-first, so an owner who only has an `email`
 * on their user row cannot sign in at all. This mutation therefore accepts
 * EITHER identifier:
 *
 *   • `phone` — an account created by an SMS-OTP sign-in; it already exists.
 *   • `email` — a legacy account. The owner MUST also pass the `phone` that
 *     should own it, so the row becomes reachable through the phone provider.
 *
 * When a phone is attached here, `phoneVerificationTime` is marked so that
 * Convex Auth's `uniqueUserWithVerifiedPhone` lookup links the upcoming
 * phone sign-in to THIS row instead of creating a duplicate customer. The
 * link is still gated on a successful SMS OTP for that exact number:
 * knowing the bootstrap secret alone can never sign anyone in, and the
 * secret is never persisted.
 *
 * Two distinct situations are supported, and they must not be confused:
 *
 *   1. FIRST-OWNER BOOTSTRAP — no owner/admin exists yet. The targeted row
 *      (already created by an SMS sign-in, or identified by its legacy
 *      email) is promoted to `owner`.
 *
 *   2. EXISTING-OWNER RE-ATTACH — an owner/admin already exists and the
 *      target IS that owner/admin. This is the phone-migration path: the
 *      legacy owner had only an email, so they could not sign in at all
 *      once email OTP was retired. The phone is attached to THAT row; no
 *      new privilege is granted and nobody else can be promoted through
 *      this path.
 */
import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireOwner } from "./admin";
import { normalizeIranianMobile } from "./auth/phoneNumber";

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("INVALID_EMAIL");
  }
  return normalized;
}

export const claimOwner = internalMutation({
  args: {
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, { email, phone }) => {
    if (!email && !phone) throw new Error("OWNER_IDENTIFIER_REQUIRED");

    const normalizedEmail = email ? normalizeEmail(email) : null;
    const canonicalPhone = phone ? normalizeIranianMobile(phone) : null;
    if (phone && !canonicalPhone) throw new Error("INVALID_PHONE");
    if (email && !canonicalPhone) {
      // An email-only owner would be unreachable after the phone
      // migration, so both identifiers are required on that path.
      throw new Error("OWNER_PHONE_REQUIRED");
    }

    const current = normalizedEmail
      ? await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", normalizedEmail))
          .unique()
      : await ctx.db
          .query("users")
          .withIndex("phone", (q) => q.eq("phone", canonicalPhone!))
          .unique();
    if (!current) throw new Error("OWNER_IDENTIFIER_NOT_FOUND");

    if (canonicalPhone) {
      const taken = await ctx.db
        .query("users")
        .withIndex("phone", (q) => q.eq("phone", canonicalPhone))
        .unique();
      if (taken && taken._id !== current._id) {
        throw new Error("OWNER_PHONE_ALREADY_USED");
      }
    }

    const phonePatch = canonicalPhone
      ? {
          phone: canonicalPhone,
          phoneVerificationTime:
            current.phoneVerificationTime ?? Date.now(),
        }
      : {};

    // Case 2 — the target is ALREADY a privileged account. Only the phone
    // is attached; the role is left exactly as it was, and no admin can be
    // created or re-pointed through this action.
    if (current.role === "owner" || current.role === "admin") {
      if (!canonicalPhone) throw new Error("OWNER_PHONE_REQUIRED");
      await ctx.db.patch(current._id, {
        ...phonePatch,
        adminStatus: "active",
        lastLoginAt: Date.now(),
      });
      return { id: current._id, role: current.role };
    }

    // Case 1 — first-owner bootstrap. Only permitted while the deployment
    // has no privileged account at all, so it can never be used later to
    // mint a second owner or to escalate a plain customer.
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
      ...phonePatch,
    });

    return { id: current._id, role: "owner" as const };
  },
});

/** Safe diagnostic; identifiers are returned only to the signed-in caller. */
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
      phone: me?.phone ?? null,
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
        phone: user.phone ?? "",
        name: user.name ?? "",
        role: user.role,
        adminStatus: user.adminStatus ?? "active",
        createdAt: user._creationTime,
        lastLoginAt: user.lastLoginAt,
      }));
  },
});
