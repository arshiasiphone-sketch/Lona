/**
 * Phase 5 — Enterprise Admin Dashboard. Orders / Customers / Reviews.
 *
 * Read-heavy admin queries (these are the data sources that back the
 * Orders, Customers, and Reviews admin index pages). Mutations
 * (order status transitions, review moderation, customer notes)
 * are introduced in the next admin slice — kept out of this file
 * because they need richer audit + role gating and the surface
 * area is non-trivial.
 *
 * Permission gating still runs through `requirePermission` so the
 * admin tree owns its access invariants — UI visibility remains a
 * hint, only the server-side check is authoritative.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { requirePermission, audit } from "./admin";

/* ──────────────────────────────────────────────────────────────
 * ORDER STATUS TRANSITION (Phase 5.3)
 *
 * Mirrors the storefront's lifecycle: each forward transition
 * appends an `order_status_history` row + an `activity_logs` row
 * so the audit trail is intact. The validity matrix is the
 * single source of truth — the FE should mirror it (disable
 * options in the dropdown) but the server is authoritative.
 * ────────────────────────────────────────────────────────────── */

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returning", "cancelled"],
  delivered: ["returning"],
  returning: ["delivered"],
  cancelled: [],
};

export const setOrderStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("returning"),
      v.literal("cancelled"),
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { id, status, note }) => {
    const user = await requirePermission(ctx, "manage_orders");
    const order = await ctx.db.get(id);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    const allowed = VALID_STATUS_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status)) {
      throw new Error(
        `INVALID_TRANSITION:${order.status}->${status}`,
      );
    }
    await ctx.db.patch(id, { status });
    await ctx.db.insert("order_status_history", {
      orderId: id,
      status,
      note,
      at: Date.now(),
    });
    await audit(ctx, user, `order.${status}`, "orders", id);
    return id;
  },
});

/* ────────────────────────────────────────────────────────────
 * ORDERS
 * ──────────────────────────────────────────────────────────── */

export const listAllOrders = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("shipped"),
        v.literal("delivered"),
        v.literal("returning"),
        v.literal("cancelled"),
      ),
    ),
  },
  handler: async (ctx, { limit, status }) => {
    await requirePermission(ctx, "manage_orders");
    let rows;
    if (status) {
      rows = await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();
    } else {
      rows = await ctx.db.query("orders").collect();
    }
    rows.sort((a, b) => b.placedAt - a.placedAt);
    return limit ? rows.slice(0, limit) : rows;
  },
});

export const getOrderWithItems = query({
  args: { id: v.id("orders") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "manage_orders");
    const order = await ctx.db.get(id);
    if (!order) return null;
    const items = await ctx.db
      .query("order_items")
      .withIndex("by_order", (q) => q.eq("orderId", id))
      .collect();
    const history = await ctx.db
      .query("order_status_history")
      .withIndex("by_order", (q) => q.eq("orderId", id))
      .collect();
    history.sort((a, b) => a.at - b.at);
    return { order, items, history };
  },
});

/* ────────────────────────────────────────────────────────────
 * CUSTOMERS
 * ──────────────────────────────────────────────────────────── */

export const listCustomers = query({
  args: {
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, { limit, search }) => {
    await requirePermission(ctx, "manage_customers");
    const rows = await ctx.db.query("users").collect();
    const needle = search?.trim().toLowerCase() ?? "";
    const filtered = needle
      ? rows.filter((u) =>
          [u.name, u.email, u.phone]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(needle),
        )
      : rows;
    filtered.sort((a, b) => b._creationTime - a._creationTime);
    return limit ? filtered.slice(0, limit) : filtered;
  },
});

export const customerDetail = query({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "manage_customers");
    const user = await ctx.db.get(id);
    if (!user) return null;
    const [orders, addresses, preferences, notifications, activity] =
      await Promise.all([
        ctx.db
          .query("orders")
          .withIndex("by_user", (q) => q.eq("userId", id))
          .collect(),
        ctx.db
          .query("addresses")
          .withIndex("by_user", (q) => q.eq("userId", id))
          .collect(),
        ctx.db
          .query("preferences")
          .withIndex("by_user", (q) => q.eq("userId", id))
          .first(),
        ctx.db
          .query("notifications")
          .withIndex("by_user", (q) => q.eq("userId", id))
          .collect(),
        ctx.db
          .query("activity_logs")
          .withIndex("by_user", (q) => q.eq("userId", id))
          .take(50),
      ]);
    const lifetimeSpendCents = orders.reduce((sum, o) => {
      if (o.status === "cancelled" || o.status === "returning") return sum;
      return sum + o.totalCents;
    }, 0);
    return {
      user,
      orders: orders.sort((a, b) => b.placedAt - a.placedAt),
      addresses,
      preferences,
      notifications: notifications.sort(
        (a, b) => b.createdAt - a.createdAt,
      ),
      activity,
      lifetimeSpendCents,
      orderCount: orders.length,
    };
  },
});

/* ────────────────────────────────────────────────────────────
 * REVIEWS
 * ──────────────────────────────────────────────────────────── */

export const listReviewsForAdmin = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("published"),
        v.literal("rejected"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { status, limit }) => {
    await requirePermission(ctx, "manage_content");
    const rows = await ctx.db.query("reviews").collect();
    const filtered = status ? rows.filter((r) => r.status === status) : rows;
    filtered.sort((a, b) => b.createdAt - a.createdAt);
    return limit ? filtered.slice(0, limit) : filtered;
  },
});

/* ────────────────────────────────────────────────────────────
 * ACTIVITY (operational feed)
 * ──────────────────────────────────────────────────────────── */

export const listActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    await requirePermission(ctx, "view_reports");
    const rows = await ctx.db.query("activity_logs").collect();
    rows.sort((a, b) => b.at - a.at);
    return limit ? rows.slice(0, limit) : rows;
  },
});

/* ────────────────────────────────────────────────────────────
 * AGGREGATES for the dashboard KPI tiles
 * ──────────────────────────────────────────────────────────── */

export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "view_reports");
    const [products, orders, users, coupons, reviews] = await Promise.all([
      ctx.db.query("products").collect(),
      ctx.db.query("orders").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("coupons").collect(),
      ctx.db.query("reviews").collect(),
    ]);
    const totalRevenue = orders.reduce((sum, o) => {
      if (o.status === "cancelled" || o.status === "returning") return sum;
      return sum + o.totalCents;
    }, 0);

    // Today-specific slice. Anchored against UTC midnight so the
    // boundary is stable across regions; the FE renders timestamps
    // in fa-IR so the admin sees an Iran-local view of "today".
    const dayMs = 86_400_000;
    const todayStart = Math.floor(Date.now() / dayMs) * dayMs;
    const todayOrders = orders.filter((o) => o.placedAt >= todayStart);
    const todaySalesCents = todayOrders.reduce((sum, o) => {
      if (o.status === "cancelled" || o.status === "returning") return sum;
      return sum + o.totalCents;
    }, 0);

    const variants = await ctx.db.query("variants").collect();
    const productIndex = new Map(products.map((p) => [p._id, p]));
    const lowStock = variants
      .filter(
        (v) => (v.available && v.stock <= 5) || (!v.available && v.stock > 0),
      )
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6)
      .map((v) => ({
        variantId: v._id,
        sku: v.sku,
        size: v.size,
        color: v.color,
        stock: v.stock,
        productSlug: productIndex.get(v.productId)?.slug ?? "—",
        productName: productIndex.get(v.productId)?.name ?? "—",
      }));
    const lowStockCount = await countLowStock(ctx, 5);

    return {
      productCount: products.length,
      publishedCount: products.filter((p) => p.status === "published").length,
      draftCount: products.filter((p) => p.status === "draft").length,
      archivedCount: products.filter((p) => p.status === "archived").length,
      orderCount: orders.length,
      activeOrderCount: orders.filter(
        (o) =>
          o.status === "pending" ||
          o.status === "processing" ||
          o.status === "shipped",
      ).length,
      customerCount: users.length,
      reviewCount: reviews.length,
      pendingReviewCount: reviews.filter((r) => r.status === "pending").length,
      activeCouponCount: coupons.filter((c) => c.active).length,
      totalRevenueCents: totalRevenue,
      todaySalesCents,
      todayOrderCount: todayOrders.length,
      lowStockVariantCount: lowStockCount,
      lowStockProducts: lowStock,
    };
  },
});

async function countLowStock(
  ctx: QueryCtx,
  threshold: number,
): Promise<number> {
  const variants = await ctx.db.query("variants").collect();
  return variants.filter(
    (v) => (v.available && v.stock <= threshold) || (!v.available && v.stock > 0),
  ).length;
}
