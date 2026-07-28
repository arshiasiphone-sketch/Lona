/**
 * Orders + order_items + status history.
 *
 * `place` resolves the opaque `productId` string on each line by-slug
 * first (matching what the cart carries today) and falls back to
 * `db.get` only when the slug does not resolve. Lines are snapshotted
 * for price-at-time and variant stock is decremented atomically.
 *
 * Coupon usage is incremented directly inside the same mutation —
 * for high-throughput production we'd move that to a follow-up
 * scheduled function, but at ÆON's volume (luxury → low checkout
 * frequency) coupling them is acceptable.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./_helpers";
import { vOrderStatus } from "./validators";
import type { Doc } from "./_generated/dataModel";

/* Queries ------------------------------------------------------- */

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const getByNumber = query({
  args: { number: v.string() },
  handler: async (ctx, { number }) => {
    const user = await requireUser(ctx);
    const row = await ctx.db
      .query("orders")
      .withIndex("by_number", (q) => q.eq("number", number))
      .unique();
    if (!row) return null;
    if (row.userId !== user._id && user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    const items = await ctx.db
      .query("order_items")
      .withIndex("by_order", (q) => q.eq("orderId", row._id))
      .collect();
    const history = await ctx.db
      .query("order_status_history")
      .withIndex("by_order", (q) => q.eq("orderId", row._id))
      .collect();
    history.sort((a, b) => a.at - b.at);
    return { ...row, items, history };
  },
});

/* Mutations ----------------------------------------------------- */

/**
 * Resolve a product row from an opaque id — by-slug first because
 * the FE cart lines carry catalog ids like "p-001", then a defensive
 * direct-id lookup if a future migration introduces Convex `_id`s.
 */
async function resolveProduct(
  ctx: {
    db: import("./_generated/server").DatabaseReader;
  },
  opaque: string
): Promise<Doc<"products"> | null> {
  const bySlug = await ctx.db
    .query("products")
    .withIndex("by_slug", (q) => q.eq("slug", opaque))
    .unique();
  if (bySlug) return bySlug;
  // Defensive fallback for live _id strings — cast the result so TS
  // doesn't widen db.get's union return.
  return (await ctx.db.get(opaque as never)) as unknown as Doc<"products"> | null;
}

/** Place an order from the current cart line set. */
/* eslint-disable @typescript-eslint/no-unused-vars */
export const place = mutation({
  args: {
    lines: v.array(
      v.object({
        // opaque product reference — string for cross-feature
        // compatibility with the FE catalog ids today.
        productId: v.string(),
        size: v.string(),
        color: v.string(),
        quantity: v.number(),
      })
    ),
    couponCode: v.optional(v.string()),
    giftNote: v.optional(v.string()),
    shipping: v.object({
      fullName: v.string(),
      line1: v.string(),
      line2: v.optional(v.string()),
      city: v.string(),
      region: v.string(),
      postalCode: v.string(),
      country: v.string(),
      method: v.union(
        v.literal("standard"),
        v.literal("express"),
        v.literal("white_glove")
      ),
    }),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Snapshot each line: load product docs for current price/name.
    const items: Array<{
      productId: string;
      size: string;
      color: string;
      quantity: number;
      productNameSnapshot: string;
      unitPriceCents: number;
      lineTotalCents: number;
    }> = [];
    let subtotal = 0;

    for (const line of args.lines) {
      const product = await resolveProduct(ctx, line.productId);
      if (!product) {
        throw new Error(`PRODUCT_MISSING:${line.productId}`);
      }
      if (!product.visible || product.status !== "published") {
        throw new Error(`PRODUCT_UNLISTED:${product.slug}`);
      }
      const lineTotal = product.priceCents * line.quantity;
      subtotal += lineTotal;
      items.push({
        productId: product.slug,
        size: line.size,
        color: line.color,
        quantity: line.quantity,
        productNameSnapshot: product.name,
        unitPriceCents: product.priceCents,
        lineTotalCents: lineTotal,
      });
    }

    // Discount.
    let discount = 0;
    if (args.couponCode) {
      const code = args.couponCode.trim().toUpperCase();
      const coupon = await ctx.db
        .query("coupons")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
      if (!coupon || !coupon.active) {
        throw new Error("INVALID_COUPON");
      }
      if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
        throw new Error("COUPON_EXHAUSTED");
      }
      discount = Math.round(subtotal * coupon.percentOff);
      await ctx.db.patch(coupon._id, { usedCount: coupon.usedCount + 1 });
    }

    // Shipping cost by method — co-located here for the demo; future
    // shipping zone tables can replace this.
    const shippingMap = { standard: 1200, express: 2400, white_glove: 4800 };
    const shippingCost = shippingMap[args.shipping.method];
    const tax = Math.round((subtotal - discount) * 0.08);
    const total = subtotal - discount + shippingCost + tax;

    // Order number — Æ-YYMMDD-####.
    const now = new Date();
    const y = String(now.getUTCFullYear()).slice(2);
    const m = String(now.getUTCMonth() + 1).padStart(2, "0");
    const d = String(now.getUTCDate()).padStart(2, "0");
    const number = `Æ-${y}${m}${d}-${String(now.getUTCMilliseconds()).slice(-4)}`;

    const orderDoc = await ctx.db.insert("orders", {
      userId: user._id,
      number,
      status: "processing",
      placedAt: now.getTime(),
      currency: "USD",
      subtotalCents: subtotal,
      discountCents: discount,
      shippingCents: shippingCost,
      taxCents: tax,
      totalCents: total,
      couponCode: args.couponCode,
      giftNote: args.giftNote,
      shipping: {
        fullName: args.shipping.fullName,
        line1: args.shipping.line1,
        line2: args.shipping.line2,
        city: args.shipping.city,
        region: args.shipping.region,
        postalCode: args.shipping.postalCode,
        country: args.shipping.country,
        method: args.shipping.method,
      },
    });

    for (const item of items) {
      await ctx.db.insert("order_items", {
        ...item,
        orderId: orderDoc,
      });

      // Decrement variant stock. Resolution mirrors the snapshot above.
      const productForVariant = await resolveProduct(ctx, item.productId);
      if (productForVariant) {
        const variant = await ctx.db
          .query("variants")
          .withIndex("by_product", (q) =>
            q.eq("productId", productForVariant._id)
          )
          .filter((q) =>
            q.and(
              q.eq(q.field("size"), item.size),
              q.eq(q.field("color"), item.color)
            )
          )
          .unique();
        if (variant) {
          if (variant.stock < item.quantity) {
            throw new Error(`INSUFFICIENT_STOCK:${item.productId}`);
          }
          await ctx.db.patch(variant._id, {
            stock: variant.stock - item.quantity,
            reserved: (variant.reserved ?? 0) + item.quantity,
          });
        }
        // If no variant row exists yet, checkout still succeeds; the
        // product row is the source of truth and a reconciliation
        // cron ingests missing variants later.
      }
    }

    await ctx.db.insert("order_status_history", {
      orderId: orderDoc,
      status: "processing",
      note: "Order received",
      at: now.getTime(),
    });

    return { orderId: orderDoc, number, totalCents: total };
  },
});

/** Admin-only status update — used by future fulfillment flow. */
export const updateStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: vOrderStatus,
    note: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role !== "admin") throw new Error("FORBIDDEN");
    if (args.trackingNumber) {
      const row = await ctx.db.get(args.orderId);
      if (row) {
        await ctx.db.patch(args.orderId, {
          shipping: { ...row.shipping, trackingNumber: args.trackingNumber },
        });
      }
    } else {
      await ctx.db.patch(args.orderId, { status: args.status });
    }
    await ctx.db.insert("order_status_history", {
      orderId: args.orderId,
      status: args.status,
      note: args.note,
      at: Date.now(),
    });
  },
});
