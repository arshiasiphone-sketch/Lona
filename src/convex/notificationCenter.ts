import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./_helpers";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db.query("notifications").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows;
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db.query("notifications").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
    return rows.filter((r) => !r.read).length;
  },
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => {
    const user = await requireUser(ctx);
    const row = await ctx.db.get(id);
    if (!row) throw new Error("NOT_FOUND");
    if (row.userId !== user._id) throw new Error("FORBIDDEN");
    await ctx.db.patch(id, { read: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db.query("notifications").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
    for (const r of rows) if (!r.read) await ctx.db.patch(r._id, { read: true });
  },
});

export const remove = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, { id }) => {
    const user = await requireUser(ctx);
    const row = await ctx.db.get(id);
    if (!row) throw new Error("NOT_FOUND");
    if (row.userId !== user._id) throw new Error("FORBIDDEN");
    await ctx.db.delete(id);
  },
});

// Admin push — create a notification for a user or broadcast via loop on client
export const adminPush = mutation({
  args: { userId: v.id("users"), title: v.string(), body: v.string(), link: v.optional(v.string()), kind: v.optional(v.union(v.literal("order"), v.literal("system"), v.literal("coupon"), v.literal("ticket"), v.literal("return"), v.literal("editorial"), v.literal("back_in_stock"))) },
  handler: async (ctx, args) => {
    const { requirePermission } = await import("./admin");
    await requirePermission(ctx, "manage_customers");
    const title = args.title.trim().slice(0, 80);
    const body = args.body.trim().slice(0, 300);
    if (!title || !body) throw new Error("INVALID");
    await ctx.db.insert("notifications", {
      userId: args.userId,
      kind: (args.kind ?? "system") as never,
      title,
      body,
      link: args.link,
      read: false,
      createdAt: Date.now(),
    });
  },
});
