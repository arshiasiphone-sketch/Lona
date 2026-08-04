/**
 * Orders + order_items + status history + payment lifecycle.
 *
 * Phase 8.1 flow (payment-first):
 *
 *   cart → validate → reserve inventory → create PENDING order
 *        → payment (provider abstraction) → confirmPayment
 *        → convert reservation → decrement stock → order PROCESSING
 *
 * Phase 8.2: gateway verification runs SERVER-SIDE. The customer's
 * browser never decides payment success — a Convex action
 * (`payments.verifyPayment`) talks to Zarinpal, then calls the
 * internal `confirmFromPayment` / `cancelFromPayment` mutations in
 * this file, which share the exact same finalize logic as the
 * public confirm/cancel mutations.
 *
 * `place` performs a full validation pass BEFORE writing anything
 * (Convex mutations are not transactional), then creates the order
 * in `status: "pending"` / `paymentStatus: "pending"` and holds
 * inventory via `inventory_reservations`. Stock is only decremented
 * when payment is confirmed; abandoned holds are expired by the
 * cron in `convex/crons.ts`.
 */
import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { requireUser } from "./_helpers";
import { requirePermission, audit } from "./admin";
import { vOrderStatus } from "./validators";
import type { Doc, Id } from "./_generated/dataModel";
import {
  reserveVariant,
  convertReservation,
  releaseReservation,
  availableStock,
} from "./reservations";
import { getByCode } from "./shipping";
import { recordNotification } from "./notifications";

/** How long a pending payment hold stays valid before the cron sweeps it. */
const RESERVATION_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

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
 * FE can render the order summary list without an N+1 lookup.
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

/* Internal (gateway verification — no user-facing auth) ---------- */
// Registered here (not in `payments.ts`) so the payment actions can
// reference them cross-module; same-module internal references from
// actions create a generated-type cycle in this Convex version.

export const getById = internalQuery({
  args: { id: v.id("orders") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const getUserById = internalQuery({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

/** Persist gateway initiation (authority/reference) onto an order. */
export const setPaymentInitiated = internalMutation({
  args: {
    orderId: v.id("orders"),
    provider: v.string(),
    reference: v.string(),
    initiatedAt: v.number(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    await ctx.db.patch(args.orderId, {
      paymentProvider: args.provider,
      paymentReference: args.reference,
      paymentStatus: "initiated",
      paymentInitiatedAt: args.initiatedAt,
      paymentExpiresAt: args.expiresAt,
    });
  },
});

/** Gateway-verified payment success — shared finalize logic. */
export const confirmFromPayment = internalMutation({
  args: {
    orderId: v.id("orders"),
    transactionId: v.optional(v.string()),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { number } = await finalizePaidOrder(
      ctx,
      args.orderId,
      args.transactionId,
      args.provider
    );
    return { orderId: args.orderId, number, status: "processing" };
  },
});

/** Gateway-reported payment failure — shared cancel logic. */
export const cancelFromPayment = internalMutation({
  args: { orderId: v.id("orders"), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { number } = await cancelOrder(ctx, args.orderId, "failed", args.note);
    return { orderId: args.orderId, number, status: "cancelled" };
  },
});

/* Helpers -------------------------------------------------------- */

/** Resolve a product row from an opaque id (slug-first, then _id). */
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
  return (await ctx.db.get(opaque as never)) as unknown as Doc<"products"> | null;
}

/** Find the inventory variant row for a product + (size, color). */
async function findVariant(
  ctx: MutationCtx,
  productId: Id<"products">,
  size: string,
  color: string
): Promise<Doc<"variants"> | null> {
  return await ctx.db
    .query("variants")
    .withIndex("by_product", (q) => q.eq("productId", productId))
    .filter((q) => q.and(q.eq(q.field("size"), size), q.eq(q.field("color"), color)))
    .unique();
}

/** Order number — Æ-YYMMDD-XXXX + random suffix against collisions. */
function makeOrderNumber(now: Date): string {
  const y = String(now.getUTCFullYear()).slice(2);
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "0");
  return `Æ-${y}${m}${d}-${rand}`;
}

function makePaymentReference(): string {
  return `PAY-${Math.random().toString(36).slice(2, 12).toUpperCase()}`;
}

/**
 * Shared finalize logic — convert reservations, decrement stock,
 * mark paid/processing, count the coupon, notify.
 *
 * Used by the public `confirmPayment` (owner/admin) and by the
 * payment action via `payments.confirmOrder`. The order must still
 * be in a payment-pending state.
 */
export async function finalizePaidOrder(
  ctx: MutationCtx,
  orderId: Id<"orders">,
  transactionId?: string,
  provider?: string
): Promise<{ number: string }> {
  const order = await ctx.db.get(orderId);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.status !== "pending") {
    throw new Error(`ORDER_NOT_PENDING:${order.status}`);
  }
  if (
    order.paymentStatus !== "pending" &&
    order.paymentStatus !== "initiated" &&
    order.paymentStatus !== "redirected"
  ) {
    throw new Error(`PAYMENT_NOT_ACTIVE:${order.paymentStatus}`);
  }

  // Convert every active reservation held for this order.
  const reservations = await ctx.db
    .query("inventory_reservations")
    .withIndex("by_order", (q) => q.eq("orderId", orderId))
    .collect();
  for (const reservation of reservations) {
    await convertReservation(ctx, reservation, `order:${order.number}`);
  }

  const now = Date.now();
  await ctx.db.patch(orderId, {
    status: "processing",
    paymentStatus: "paid",
    paidAt: now,
    ...(transactionId ? { paymentTransactionId: transactionId } : {}),
    ...(provider ? { paymentProvider: provider } : {}),
  });
  await ctx.db.insert("order_status_history", {
    orderId,
    status: "processing",
    note: "پرداخت تأیید شد — سفارش وارد مرحله پردازش شد",
    at: now,
  });

  // Coupon is consumed only on paid orders.
  if (order.couponCode) {
    const coupon = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", order.couponCode!.toUpperCase()))
      .unique();
    if (coupon) {
      await ctx.db.patch(coupon._id, { usedCount: coupon.usedCount + 1 });
    }
  }

  if (order.userId) {
    await recordNotification(ctx, {
      userId: order.userId,
      kind: "order",
      title: "پرداخت موفق",
      body: `پرداخت سفارش ${order.number} تأیید شد و در حال آمادهسازی است.`,
      link: "/dashboard",
    });
  }
  return { number: order.number };
}

/**
 * Shared cancel logic — release inventory holds, mark cancelled.
 * Used by the public `cancelPending` and the payment action via
 * `payments.cancelOrderForPayment`.
 */
export async function cancelOrder(
  ctx: MutationCtx,
  orderId: Id<"orders">,
  paymentStatus: "cancelled" | "failed",
  note?: string
): Promise<{ number: string }> {
  const order = await ctx.db.get(orderId);
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.status !== "pending") {
    throw new Error(`ORDER_NOT_PENDING:${order.status}`);
  }

  const reservations = await ctx.db
    .query("inventory_reservations")
    .withIndex("by_order", (q) => q.eq("orderId", orderId))
    .collect();
  for (const reservation of reservations) {
    await releaseReservation(ctx, reservation, "cancelled");
  }

  const now = Date.now();
  await ctx.db.patch(orderId, { status: "cancelled", paymentStatus });
  await ctx.db.insert("order_status_history", {
    orderId,
    status: "cancelled",
    note: note ?? (paymentStatus === "failed" ? "پرداخت ناموفق" : "انصراف از پرداخت"),
    at: now,
  });

  if (order.userId) {
    await recordNotification(ctx, {
      userId: order.userId,
      kind: "order",
      title: paymentStatus === "failed" ? "پرداخت ناموفق" : "سفارش لغو شد",
      body:
        paymentStatus === "failed"
          ? `پرداخت سفارش ${order.number} ناموفق بود. موجودی رزرو شده آزاد شد.`
          : `سفارش ${order.number} لغو شد. موجودی رزرو شده آزاد شد.`,
      link: "/dashboard",
    });
  }
  return { number: order.number };
}

/* Mutations ------------------------------------------------------ */

/**
 * Phase 8.1 — start a checkout: validate everything, reserve
 * inventory, and create the order in `pending` (payment pending).
 * Never decrements stock or increments coupon usage — those happen
 * only after `confirmPayment`.
 */
export const place = mutation({
  args: {
    lines: v.array(
      v.object({
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
    if (!args.lines.length) throw new Error("EMPTY_CART");

    /* ── PASS 1: snapshot + validate every line (no writes) ── */
    const items: Array<{
      productId: string;
      size: string;
      color: string;
      quantity: number;
      productNameSnapshot: string;
      unitPriceCents: number;
      lineTotalCents: number;
      skuSnapshot?: string;
      imageSnapshot?: string;
      variantId?: Id<"variants">;
    }> = [];
    let subtotal = 0;

    for (const line of args.lines) {
      if (!Number.isInteger(line.quantity) || line.quantity < 1) {
        throw new Error(`INVALID_QUANTITY:${line.productId}`);
      }
      const product = await resolveProduct(ctx, line.productId);
      if (!product) throw new Error(`PRODUCT_MISSING:${line.productId}`);
      if (!product.visible || product.status !== "published") {
        throw new Error(`PRODUCT_UNLISTED:${product.slug}`);
      }
      if (product.priceCents <= 0) throw new Error(`PRODUCT_NO_PRICE:${product.slug}`);

      const variant = await findVariant(ctx, product._id, line.size, line.color);
      if (variant && (!variant.available || availableStock(variant) < line.quantity)) {
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
        skuSnapshot: variant?.sku,
        imageSnapshot: product.imageUrls?.[0],
        variantId: variant?._id,
      });
    }

    /* ── PASS 2: coupon validation (no writes) ── */
    let discount = 0;
    let couponRow: Doc<"coupons"> | null = null;
    if (args.couponCode && args.couponCode.trim()) {
      const code = args.couponCode.trim().toUpperCase();
      const coupon = await ctx.db
        .query("coupons")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
      if (!coupon || !coupon.active) throw new Error("INVALID_COUPON");
      if (coupon.validFrom && Date.now() < coupon.validFrom) throw new Error("COUPON_NOT_STARTED");
      if (coupon.validUntil && Date.now() > coupon.validUntil) throw new Error("COUPON_EXPIRED");
      if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
        throw new Error("COUPON_EXHAUSTED");
      }
      const rate = Math.min(Math.max(coupon.percentOff, 0), 1);
      discount = Math.round(subtotal * rate);
      couponRow = coupon;
    }

    /* ── PASS 3: shipping cost (live methods, fallback map) ── */
    const shippingRow = await getByCode(ctx, args.shipping.method);
    const shippingCost = shippingRow?.priceCents ?? 0;
    const tax = 0; // VAT included in Iranian retail pricing
    const total = Math.max(0, subtotal - discount) + shippingCost;

    /* ── PASS 4: writes (order → items → reservations → history) ── */
    const now = new Date();
    const placedAt = now.getTime();
    const paymentExpiresAt = placedAt + RESERVATION_WINDOW_MS;
    const number = makeOrderNumber(now);
    const paymentReference = makePaymentReference();

    const orderDoc = await ctx.db.insert("orders", {
      userId: user._id,
      number,
      status: "pending",
      placedAt,
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
      paymentStatus: "pending",
      paymentProvider: "mock",
      paymentReference,
      paymentInitiatedAt: placedAt,
      paymentExpiresAt,
      shippingMethodName: shippingRow?.name,
    });

    for (const item of items) {
      await ctx.db.insert("order_items", {
        orderId: orderDoc,
        productId: item.productId,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        productNameSnapshot: item.productNameSnapshot,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents,
        skuSnapshot: item.skuSnapshot,
        imageSnapshot: item.imageSnapshot,
      });

      // Hold inventory — this is the TOCTOU guard.
      if (item.variantId) {
        const variant = await ctx.db.get(item.variantId);
        if (variant && availableStock(variant) >= item.quantity) {
          await reserveVariant(ctx, {
            variant,
            quantity: item.quantity,
            orderId: orderDoc,
            userId: user._id,
            sessionId: `u:${user._id}`,
            expiresAt: paymentExpiresAt,
          });
        }
      }
    }

    await ctx.db.insert("order_status_history", {
      orderId: orderDoc,
      status: "pending",
      note: "سفارش ثبت شد — در انتظار پرداخت",
      at: placedAt,
    });

    await audit(ctx, user, "order.create", "orders", orderDoc, {
      number,
      totalCents: total,
      paymentReference,
    });
    await recordNotification(ctx, {
      userId: user._id,
      kind: "order",
      title: "سفارش در انتظار پرداخت",
      body: `سفارش ${number} ثبت شد. لطفاً پرداخت را تکمیل کنید.`,
      link: "/dashboard",
    });

    return {
      orderId: orderDoc,
      number,
      totalCents: total,
      paymentStatus: "pending" as const,
      paymentReference,
      paymentExpiresAt,
    };
  },
});

/**
 * Confirm a successful payment — owner or admin. Accepts the gateway
 * transaction id so the admin drawer can show it on the order.
 */
export const confirmPayment = mutation({
  args: {
    orderId: v.id("orders"),
    transactionId: v.optional(v.string()),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.userId !== user._id && user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    const { number } = await finalizePaidOrder(
      ctx,
      args.orderId,
      args.transactionId,
      args.provider
    );
    await audit(ctx, user, "payment.confirm", "orders", args.orderId, {
      number,
      paymentReference: order.paymentReference,
      transactionId: args.transactionId,
    });
    return { orderId: args.orderId, number, status: "processing" };
  },
});

/**
 * Cancel a pending order before payment completes — owner or admin.
 */
export const cancelPending = mutation({
  args: {
    orderId: v.id("orders"),
    paymentStatus: v.union(v.literal("cancelled"), v.literal("failed")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.userId !== user._id && user.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    const { number } = await cancelOrder(
      ctx,
      args.orderId,
      args.paymentStatus,
      args.note
    );
    await audit(ctx, user, "order.cancel", "orders", args.orderId, {
      paymentStatus: args.paymentStatus,
      number,
    });
    return { orderId: args.orderId, number, status: "cancelled" };
  },
});

/**
 * Refund a paid order (admin): mark payment refunded, return
 * inventory to stock, move the order to `returning`.
 */
export const refund = mutation({
  args: { orderId: v.id("orders"), note: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requirePermission(ctx, "manage_orders");
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.paymentStatus !== "paid") {
      throw new Error(`PAYMENT_NOT_PAID:${order.paymentStatus}`);
    }

    const items = await ctx.db
      .query("order_items")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .collect();
    for (const item of items) {
      const product = await resolveProduct(ctx, item.productId);
      if (!product) continue;
      const variant = await findVariant(ctx, product._id, item.size, item.color);
      if (!variant) continue;
      await ctx.db.patch(variant._id, { stock: variant.stock + item.quantity });
      await ctx.db.insert("stock_movements", {
        variantId: variant._id,
        kind: "return",
        quantity: item.quantity,
        reason: `refund:${order.number}`,
        at: Date.now(),
      });
    }

    const now = Date.now();
    await ctx.db.patch(args.orderId, {
      paymentStatus: "refunded",
      status: "returning",
    });
    await ctx.db.insert("order_status_history", {
      orderId: args.orderId,
      status: "returning",
      note: args.note ?? "بازگشت وجه انجام شد — موجودی به انبار برگشت",
      at: now,
    });

    await audit(ctx, user, "payment.refund", "orders", args.orderId, {
      number: order.number,
    });
    if (order.userId) {
      await recordNotification(ctx, {
        userId: order.userId,
        kind: "order",
        title: "بازگشت وجه",
        body: `بازگشت وجه سفارش ${order.number} انجام شد.`,
        link: "/dashboard",
      });
    }
    return { orderId: args.orderId, number: order.number, paymentStatus: "refunded" };
  },
});

/** Admin status update — used by fulfillment flow. */
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
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    const patch: Record<string, unknown> = { status: args.status };
    if (args.trackingNumber) {
      patch.shipping = { ...order.shipping, trackingNumber: args.trackingNumber };
    }
    await ctx.db.patch(args.orderId, patch);
    await ctx.db.insert("order_status_history", {
      orderId: args.orderId,
      status: args.status,
      note: args.note,
      at: Date.now(),
    });
    await audit(ctx, user, `order.status.${args.status}`, "orders", args.orderId, {
      from: order.status,
      to: args.status,
      trackingNumber: args.trackingNumber,
    });

    if (order.userId && (args.status === "shipped" || args.status === "delivered")) {
      await recordNotification(ctx, {
        userId: order.userId,
        kind: "order",
        title: args.status === "shipped" ? "سفارش ارسال شد" : "سفارش تحویل شد",
        body:
          args.status === "shipped"
            ? `سفارش ${order.number} با موفقیت ارسال شد.`
            : `سفارش ${order.number} تحویل داده شد. از خرید شما سپاسگزاریم.`,
        link: "/dashboard",
      });
    }
    return args.orderId;
  },
});
