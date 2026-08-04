/**
 * Variants + stock_movements tables.
 *
 * Variants are server-only rows used for inventory decrementing at
 * checkout. The customer's flat `(productId, size, color)` cart line
 * resolves to a `variants` row before stock is touched.
 */
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./_helpers";

/* Variants ------------------------------------------------------- */

/** All variants for a product. */
export const byProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    return await ctx.db
      .query("variants")
      .withIndex("by_product", (q) => q.eq("productId", productId))
      .collect();
  },
});

export const getBySku = query({
  args: { sku: v.string() },
  handler: async (ctx, { sku }) => {
    return await ctx.db
      .query("variants")
      .withIndex("by_sku", (q) => q.eq("sku", sku))
      .unique();
  },
});

/** Idempotent upsert used by the seed action. */
export const upsertBySku = mutation({
  args: {
    productId: v.id("products"),
    sku: v.string(),
    size: v.string(),
    color: v.string(),
    stock: v.number(),
    reserved: v.optional(v.number()),
    priceCentsOverride: v.optional(v.number()),
    available: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("variants")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("variants", args);
  },
});

/**
 * Decrement stock atomically — used by checkout on confirmed order.
 *
 * Phase 7.5 security hardening: this endpoint used to let any signed-in
 * caller decrement arbitrary stock. Checkout now owns its own
 * pre-validated decrement inside `orders.place`; this surface is
 * admin-only (restock reconciliation, manual adjustments) so it is
 * gated with `requireAdmin`.
 */
export const reserve = mutation({
  args: {
    productId: v.id("products"),
    size: v.string(),
    color: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, { productId, size, color, quantity }) => {
    await requireAdmin(ctx);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error("INVALID_QUANTITY");
    }
    const variant = await ctx.db
      .query("variants")
      .withIndex("by_product", (q) => q.eq("productId", productId))
      .filter((q) =>
        q.and(q.eq(q.field("size"), size), q.eq(q.field("color"), color))
      )
      .unique();
    if (!variant) {
      throw new Error(`Variant missing: ${productId}/${size}/${color}`);
    }
    if (variant.stock < quantity) {
      throw new Error("INSUFFICIENT_STOCK");
    }
    await ctx.db.patch(variant._id, {
      stock: variant.stock - quantity,
      reserved: (variant.reserved ?? 0) + quantity,
    });
    await ctx.db.insert("stock_movements", {
      variantId: variant._id,
      kind: "sale",
      quantity: -quantity,
      reason: "checkout_reserve",
      at: Date.now(),
    });
    return variant._id;
  },
});

/** Restock — used by returns + replenishment jobs. */
export const restock = mutation({
  args: {
    variantId: v.id("variants"),
    quantity: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { variantId, quantity, reason }) => {
    await requireAdmin(ctx);
    const v = await ctx.db.get(variantId);
    if (!v) return;
    await ctx.db.patch(variantId, { stock: v.stock + quantity });
    await ctx.db.insert("stock_movements", {
      variantId,
      kind: "restock",
      quantity,
      reason,
      at: Date.now(),
    });
  },
});

/* Warehouses ----------------------------------------------------- */

export const listWarehouses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("warehouses").collect();
  },
});
