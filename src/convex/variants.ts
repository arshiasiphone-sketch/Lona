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
import { requirePermission, audit } from "./admin";
import { availableStock } from "./reservations";

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
 * Place a manual hold on a variant (admin tool).
 *
 * Phase 8.1: checkout no longer decrements stock through this path —
 * it holds units via `inventory_reservations` and only `orders`
 * converts them. This admin surface is for manual holds /
 * reconciliation and now follows the same hold model: `reserved +=`
 * without touching `stock`, so the reservation ledger stays the
 * single source of truth.
 */
export const reserve = mutation({
  args: {
    productId: v.id("products"),
    size: v.string(),
    color: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, { productId, size, color, quantity }) => {
    const user = await requirePermission(ctx, "manage_inventory");
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
    if (availableStock(variant) < quantity) {
      throw new Error("INSUFFICIENT_STOCK");
    }
    await ctx.db.patch(variant._id, {
      reserved: (variant.reserved ?? 0) + quantity,
    });
    await audit(ctx, user, "inventory.reserve", "variants", variant._id, {
      sku: variant.sku,
      quantity,
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
    const user = await requirePermission(ctx, "manage_inventory");
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error("INVALID_QUANTITY");
    }
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
    await audit(ctx, user, "inventory.restock", "variants", variantId, {
      sku: v.sku,
      quantity,
      reason,
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
