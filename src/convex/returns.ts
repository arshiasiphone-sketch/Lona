import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./_helpers";
import { requirePermission, audit } from "./admin";
import { vReturnStatus, vReturnType } from "./validators";
import { recordNotification } from "./notifications";

export const requestReturn = mutation({
  args: {
    orderId: v.id("orders"),
    type: vReturnType,
    reason: v.string(),
    description: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.userId !== user._id) throw new Error("FORBIDDEN");
    if (!["delivered", "shipped"].includes(order.status)) throw new Error("ORDER_NOT_ELIGIBLE");
    const reason = args.reason.trim();
    if (reason.length < 4) throw new Error("INVALID_REASON");
    // One open return per order
    const existing = await ctx.db.query("returns").withIndex("by_order", (q) => q.eq("orderId", args.orderId)).collect();
    if (existing.some((r) => r.status === "submitted" || r.status === "reviewing")) throw new Error("RETURN_ALREADY_OPEN");
    const now = Date.now();
    const id = await ctx.db.insert("returns", {
      orderId: args.orderId,
      userId: user._id,
      type: args.type,
      reason,
      description: args.description?.trim().slice(0, 1000),
      images: args.images?.slice(0, 4),
      status: "submitted",
      createdAt: now,
      updatedAt: now,
    });
    await audit(ctx, user, "return.create", "returns", id, { orderId: String(args.orderId) });
    await recordNotification(ctx, {
      userId: user._id,
      kind: "return",
      title: "درخواست مرجوعی ثبت شد",
      body: `درخواست ${args.type === "return" ? "مرجوعی" : "تعویض"} برای سفارش ${order.number} ثبت شد.`,
      link: "/account",
    });
    return id;
  },
});

export const updateReturnStatus = mutation({
  args: { returnId: v.id("returns"), status: vReturnStatus, adminNote: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const admin = await requirePermission(ctx, "manage_orders");
    const ret = await ctx.db.get(args.returnId);
    if (!ret) throw new Error("RETURN_NOT_FOUND");
    await ctx.db.patch(args.returnId, { status: args.status, adminNote: args.adminNote?.slice(0, 1000), updatedAt: Date.now() });
    await audit(ctx, admin, `return.${args.status}`, "returns", args.returnId);
    await recordNotification(ctx, {
      userId: ret.userId,
      kind: "return",
      title: args.status === "approved" ? "درخواست تأیید شد" : args.status === "rejected" ? "درخواست رد شد" : "به‌روزرسانی مرجوعی",
      body: `وضعیت درخواست مرجوعی به ${args.status} تغییر کرد.${args.adminNote ? " یادداشت: " + args.adminNote : ""}`,
      link: "/account",
    });
  },
});

export const listMyReturns = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db.query("returns").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows;
  },
});

export const listAllReturns = query({
  args: { status: v.optional(vReturnStatus) },
  handler: async (ctx, { status }) => {
    await requirePermission(ctx, "manage_orders");
    const rows = status
      ? await ctx.db.query("returns").withIndex("by_status", (q) => q.eq("status", status)).collect()
      : await ctx.db.query("returns").collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows;
  },
});

export const getReturn = query({
  args: { returnId: v.id("returns") },
  handler: async (ctx, { returnId }) => {
    const user = await requireUser(ctx);
    const ret = await ctx.db.get(returnId);
    if (!ret) return null;
    const isAdmin = user.role === "admin" || user.role === "owner" || user.role === "manager";
    if (ret.userId !== user._id && !isAdmin) throw new Error("FORBIDDEN");
    return ret;
  },
});
