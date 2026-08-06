import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { adminPermissionLiterals } from "./validators";
import { audit, requireOwner } from "./admin";

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
    email: v.string(),
    role: v.string(),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const owner = await requireOwner(ctx);
    const email = normalizeEmail(args.email);
    if (!isInvitableRole(args.role)) throw new Error("INVALID_ADMIN_ROLE");
    const permissions = [...new Set(args.permissions)].filter(isAllowedPermission);
    if (permissions.length !== args.permissions.length) throw new Error("INVALID_ADMIN_PERMISSION");

    const existing = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", email)).unique();
    if (existing?.role === "owner") throw new Error("OWNER_PROTECTED");
    if (existing && isInvitableRole(existing.role ?? "") && existing.adminStatus !== "disabled") {
      throw new Error("ADMIN_ALREADY_EXISTS");
    }

    const rawToken = crypto.randomUUID();
    const tokenHash = await hashToken(rawToken);
    const now = Date.now();
    const previous = await ctx.db.query("admin_invites").withIndex("by_email", (q) => q.eq("email", email)).collect();
    for (const invite of previous) {
      if (!invite.usedAt) await ctx.db.patch(invite._id, { usedAt: now });
    }
    await ctx.db.insert("admin_invites", {
      email,
      role: args.role,
      permissions,
      invitedBy: owner._id,
      tokenHash,
      expiresAt: now + INVITE_TTL_MS,
      createdAt: now,
    });
    await audit(ctx, owner, "admin.invite.create", "admin_invites", undefined, { email, role: args.role });
    // The token is returned once so the owner can deliver it through the
    // configured email channel. It is never persisted in plaintext.
    return { token: rawToken, email, expiresAt: now + INVITE_TTL_MS };
  },
});

export const acceptInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHORIZED");
    const user = await ctx.db.get(userId);
    if (!user?.email) throw new Error("EMAIL_REQUIRED");
    const tokenHash = await hashToken(token.trim());
    const invite = await ctx.db.query("admin_invites").withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash)).unique();
    if (!invite || invite.usedAt || invite.expiresAt <= Date.now()) throw new Error("INVITE_INVALID_OR_EXPIRED");
    if (user.email.trim().toLowerCase() !== invite.email) throw new Error("INVITE_EMAIL_MISMATCH");
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
