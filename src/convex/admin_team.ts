import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { adminPermissionLiterals } from "./validators";
import { audit, requireOwner } from "./admin";
import { normalizeIranianMobile } from "./auth/phoneNumber";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const INVITABLE_ROLES = ["admin", "manager", "editor", "support"] as const;
type InvitableRole = (typeof INVITABLE_ROLES)[number];

function isInvitableRole(role: string): role is InvitableRole {
  return (INVITABLE_ROLES as readonly string[]).includes(role);
}

function isAllowedPermission(permission: string) {
  return permission !== "manage_admins" &&
    (adminPermissionLiterals as readonly string[]).includes(permission);
}

async function hashToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

function normalizeEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error("INVALID_EMAIL");
  return normalized;
}

/**
 * An invite targets exactly one identity. Since authentication is
 * phone-first, the canonical `+98…` phone is the primary channel and
 * `email` is kept for staff accounts that predate the migration.
 */
type InviteTarget = { email?: string; phone?: string };

function resolveInviteTarget(identifier: string): InviteTarget {
  const value = identifier.trim();
  if (!value) throw new Error("INVITE_IDENTIFIER_REQUIRED");
  if (value.includes("@")) return { email: normalizeEmail(value) };
  const phone = normalizeIranianMobile(value);
  if (!phone) throw new Error("INVALID_INVITE_IDENTIFIER");
  return { phone };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireOwner(ctx);
    const users = await ctx.db.query("users").collect();
    return users
      .filter((user) => isInvitableRole(user.role ?? "") || user.role === "owner")
      .map((user) => ({
        id: user._id,
        email: user.email ?? "",
        phone: user.phone ?? "",
        name: user.name ?? "",
        role: user.role,
        adminStatus: user.adminStatus ?? "active",
        createdAt: user._creationTime,
        invitedAt: user.invitedAt,
        disabledAt: user.disabledAt,
        lastLoginAt: user.lastLoginAt,
        permissions: user.adminPermissions ?? [],
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const activity = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await requireOwner(ctx);
    const rows = await ctx.db.query("activity_logs").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return rows.sort((a, b) => b.at - a.at).slice(0, 100);
  },
});

export const createInvite = mutation({
  args: {
    /** An email address or an Iranian mobile number (09… / +98…). */
    identifier: v.string(),
    role: v.string(),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx);
    const target = resolveInviteTarget(args.identifier);
    if (!isInvitableRole(args.role)) throw new Error("INVALID_ADMIN_ROLE");
    const permissions = [...new Set(args.permissions)].filter(isAllowedPermission);
    if (permissions.length !== args.permissions.length) throw new Error("INVALID_ADMIN_PERMISSION");

    const existing = target.email
      ? await ctx.db.query("users").withIndex("email", (q) => q.eq("email", target.email!)).unique()
      : await ctx.db.query("users").withIndex("phone", (q) => q.eq("phone", target.phone!)).unique();
    if (existing?.role === "owner") throw new Error("OWNER_PROTECTED");
    if (existing && isInvitableRole(existing.role ?? "") && existing.adminStatus !== "disabled") {
      throw new Error("ADMIN_ALREADY_EXISTS");
    }

    const rawToken = crypto.randomUUID();
    const tokenHash = await hashToken(rawToken);
    const now = Date.now();
    const previous = target.email
      ? await ctx.db.query("admin_invites").withIndex("by_email", (q) => q.eq("email", target.email!)).collect()
      : await ctx.db.query("admin_invites").withIndex("by_phone", (q) => q.eq("phone", target.phone!)).collect();
    for (const invite of previous) {
      if (!invite.usedAt) await ctx.db.patch(invite._id, { usedAt: now });
    }
    await ctx.db.insert("admin_invites", {
      email: target.email,
      phone: target.phone,
      role: args.role,
      permissions,
      invitedBy: owner._id,
      tokenHash,
      expiresAt: now + INVITE_TTL_MS,
      createdAt: now,
    });
    await audit(ctx, owner, "admin.invite.create", "admin_invites", undefined, {
      email: target.email ?? null,
      phone: target.phone ?? null,
      role: args.role,
    });
    // The token is returned once so the owner can deliver it out of band.
    // It is never persisted in plaintext.
    return {
      token: rawToken,
      email: target.email ?? "",
      phone: target.phone ?? "",
      expiresAt: now + INVITE_TTL_MS,
    };
  },
});

/**
 * Owner-only identity pre-provisioning.
 *
 * Attaches (or replaces) the canonical mobile on an EXISTING staff account
 * so the member's next SMS-OTP sign-in links to that account instead of
 * creating a new one. This is the deliberate, owner-verified linking path
 * for staff who predate the phone migration: an arbitrary phone is never
 * auto-linked to an account, and the member still has to prove ownership
 * of the number with a real OTP before any session is issued.
 */
export const setPhone = mutation({
  args: { userId: v.id("users"), phone: v.string() },
  handler: async (ctx, { userId, phone }) => {
    const owner = await requireOwner(ctx);
    const canonical = normalizeIranianMobile(phone);
    if (!canonical) throw new Error("INVALID_PHONE");
    const target = await ctx.db.get(userId);
    if (!target) throw new Error("USER_NOT_FOUND");
    if (target.role === "user" || target.role === "member") {
      throw new Error("NOT_AN_ADMIN");
    }
    const claimed = await ctx.db
      .query("users")
      .withIndex("phone", (q) => q.eq("phone", canonical))
      .unique();
    if (claimed && claimed._id !== userId) throw new Error("PHONE_ALREADY_USED");

    const before = { phone: target.phone ?? null };
    await ctx.db.patch(userId, {
      phone: canonical,
      phoneVerificationTime: target.phoneVerificationTime ?? Date.now(),
    });
    await audit(ctx, owner, "admin.phone.update", "users", userId, {
      before,
      after: { phone: canonical },
    });
    return { userId, phone: canonical };
  },
});

export const acceptInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHORIZED");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("UNAUTHORIZED");
    const tokenHash = await hashToken(token.trim());
    const invite = await ctx.db.query("admin_invites").withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash)).unique();
    if (!invite || invite.usedAt || invite.expiresAt <= Date.now()) throw new Error("INVITE_INVALID_OR_EXPIRED");
    // The signed-in identity must own the invited email OR the invited
    // (already OTP-verified) phone number.
    const emailMatches =
      !!invite.email && user.email?.trim().toLowerCase() === invite.email;
    const phoneMatches = !!invite.phone && user.phone === invite.phone;
    if (!emailMatches && !phoneMatches) throw new Error("INVITE_IDENTITY_MISMATCH");
    if (!isInvitableRole(invite.role)) throw new Error("INVALID_ADMIN_ROLE");

    const previous = { role: user.role, adminStatus: user.adminStatus };
    await ctx.db.patch(userId, {
      role: invite.role,
      adminPermissions: invite.permissions,
      adminStatus: "active",
      createdBy: invite.invitedBy,
      invitedAt: invite.createdAt,
      disabledAt: undefined,
      lastLoginAt: Date.now(),
    });
    await ctx.db.patch(invite._id, { usedAt: Date.now() });
    await audit(ctx, user, "admin.invite.accept", "users", userId, { before: previous, role: invite.role });
    return { role: invite.role };
  },
});

export const updateRole = mutation({
  args: { userId: v.id("users"), role: v.string(), permissions: v.array(v.string()) },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx);
    if (!isInvitableRole(args.role)) throw new Error("INVALID_ADMIN_ROLE");
    const permissions = [...new Set(args.permissions)].filter(isAllowedPermission);
    if (permissions.length !== args.permissions.length) throw new Error("INVALID_ADMIN_PERMISSION");
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("USER_NOT_FOUND");
    if (target.role === "owner" || args.userId === owner._id) throw new Error("OWNER_PROTECTED");
    if (!isInvitableRole(target.role ?? "")) throw new Error("NOT_AN_ADMIN");
    const before = { role: target.role, adminStatus: target.adminStatus, permissions: target.adminPermissions ?? [] };
    await ctx.db.patch(args.userId, { role: args.role, adminPermissions: permissions, adminStatus: "active", disabledAt: undefined });
    await audit(ctx, owner, "admin.role.update", "users", args.userId, { before, after: { role: args.role, permissions } });
    return args.userId;
  },
});

export const setStatus = mutation({
  args: { userId: v.id("users"), status: v.union(v.literal("active"), v.literal("disabled")) },
  handler: async (ctx, { userId, status }) => {
    const owner = await requireOwner(ctx);
    const target = await ctx.db.get(userId);
    if (!target) throw new Error("USER_NOT_FOUND");
    if (target.role === "owner" || userId === owner._id) throw new Error("OWNER_PROTECTED");
    if (!isInvitableRole(target.role ?? "")) throw new Error("NOT_AN_ADMIN");
    const before = { role: target.role, adminStatus: target.adminStatus };
    await ctx.db.patch(userId, { adminStatus: status, disabledAt: status === "disabled" ? Date.now() : undefined });
    await audit(ctx, owner, status === "disabled" ? "admin.disable" : "admin.enable", "users", userId, { before, after: { status } });
    return userId;
  },
});
