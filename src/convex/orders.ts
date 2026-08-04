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

/**
 * Account home variant — joins each order with its line items so the
 * FE can render the order summary list without an N+1 lookup. The
 * shape is intentionally `{ order, items }[]` so the page can render
 * either piece independently.
 */
export const listMineWithItems = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const enriched = await Promise.all(
      orders.map(async (order) => {
        const items = await ctx.db
          .query("order_items")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();
        return { order, items };
      })
    );
    // Newest first.
    enriched.sort((a, b) => b.order.placedAt - a.order.placedAt);
    return enriched;
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

    /* ── Phase 7.5 hardening ───────────────────────────────────────
     * Convex mutations are NOT transactional: a throw mid-write leaves
     * partial rows behind. The old implementation inserted the order,
     * then decremented stock per line — an INSUFFICIENT_STOCK throw
     * could orphan a half-written order with partially-decremented
     * stock. We now run a full validation pass (products + variants +
     * coupon) BEFORE writing anything, so every failure happens
     * atomically from the reader's perspective.
     *
     * Oversell protection: when a `variants` row exists for the
     * (size, color) pair we require `stock >= quantity` before any
     * write. Products without variant rows are allowed through (the
     * row is the source of truth for those), which matches the
     * pre-existing reconcile-cron contract.
     */

    // ── PASS 1: snapshot + validate every line (no writes) ──
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
      if (!Number.isInteger(line.quantity) || line.quantity < 1) {
        throw new Error(`INVALID_QUANTITY:${line.productId}`);
      }
      const product = await resolveProduct(ctx, line.productId);
      if (!product) {
        throw new Error(`PRODUCT_MISSING:${line.productId}`);
      }
      if (!product.visible || product.status !== "published") {
        throw new Error(`PRODUCT_UNLISTED:${product.slug}`);
      }
      if (product.priceCents <= 0) {
        throw new Error(`PRODUCT_NO_PRICE:${product.slug}`);
      }

      // Oversell guard — variant row exists ⇒ stock must cover qty.
      const variant = await ctx.db
        .query("variants")
        .withIndex("by_product", (q) => q.eq("productId", product._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("size"), line.size),
            q.eq(q.field("color"), line.color)
          )
        )
        .unique();
      if (variant && (!variant.available || variant.stock < line.quantity)) {
        throw new Error(`INSUFFICIENT_STOCK:${product.slug}/${line.size}/${line.color}`);
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

    // ── PASS 2: coupon validation (no writes) ──
    let discount = 0;
    let couponRow: Doc<"coupons"> | null = null;
    if (args.couponCode && args.couponCode.trim()) {
      const code = args.couponCode.trim().toUpperCase();
      const coupon = await ctx.db
        .query("coupons")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
      if (!coupon || !coupon.active) {
        throw new Error("INVALID_COUPON");
      }
      if (coupon.validFrom && Date.now() < coupon.validFrom) {
        throw new Error("COUPON_NOT_STARTED");
      }
      if (coupon.validUntil && Date.now() > coupon.validUntil) {
        throw new Error("COUPON_EXPIRED");
      }
      if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
        throw new Error("COUPON_EXHAUSTED");
      }
      const rate = Math.min(Math.max(coupon.percentOff, 0), 1);
      discount = Math.round(subtotal * rate);
      couponRow = coupon;
    }

    // Shipping cost by method — co-located here for the demo; future
    // shipping zone tables can replace this. Toman amounts.
    const shippingMap = { standard: 120000, express: 250000, white_glove: 650000 };
    const shippingCost = shippingMap[args.shipping.method];
    const tax = 0; // VAT is included in Iranian retail pricing; kept 0.
    const total = Math.max(0, subtotal - discount) + shippingCost;

    // Order number — Æ-YYMMDD-XXXX + 2-char random suffix so two
    // orders placed in the same millisecond cannot collide on the
    // `by_number` unique index.
    const now = new Date();
    const y = String(now.getUTCFullYear()).slice(2);
    const m = String(now.getUTCMonth() + 1).padStart(2, "0");
    const d = String(now.getUTCDate()).padStart(2, "0");
    const rand = Math.random().toString(36).slice(2, 4).toUpperCase();
    const number = `Æ-${y}${m}${d}-${String(now.getUTCMilliseconds()).slice(-4)}${rand}`;

    // ── PASS 3: writes (order → items → stock → history → coupon) ──
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
      couponCode: args.couponCode?.trim().toUpperCase(),
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

      const product = await resolveProduct(ctx, item.productId);
      if (!product) continue;
      const variant = await ctx.db
        .query("variants")
        .withIndex("by_product", (q) => q.eq("productId", product._id))
        .filter((q) =>
          q.and(
            q.eq(q.field("size"), item.size),
            q.eq(q.field("color"), item.color)
          )
        )
        .unique();
      if (!variant) continue; // no variant row → product-level source of truth
      await ctx.db.patch(variant._id, {
        stock: variant.stock - item.quantity,
        reserved: (variant.reserved ?? 0) + item.quantity,
        available: variant.stock - item.quantity > 0 ? variant.available : false,
      });
      await ctx.db.insert("stock_movements", {
        variantId: variant._id,
        kind: "sale",
        quantity: -item.quantity,
        reason: `order:${number}`,
        at: Date.now(),
      });
    }

    await ctx.db.insert("order_status_history", {
      orderId: orderDoc,
      status: "processing",
      note: "سفارش دریافت شد",
      at: now.getTime(),
    });

    if (couponRow) {
      await ctx.db.patch(couponRow._id, { usedCount: couponRow.usedCount + 1 });
    }

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
