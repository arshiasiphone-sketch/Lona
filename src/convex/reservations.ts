/**
 * Phase 8.1 — inventory reservation system.
 *
 * Solves the TOCTOU race on the last unit of a variant: instead of
 * checking `stock` and decrementing in two separate moments, a
 * checkout now reserves units up-front (hold on `variants.reserved`)
 * and only decrements `stock` after payment is confirmed.
 *
 * Invariant that every function here maintains:
 *   available(variant) = max(0, variant.stock - (variant.reserved ?? 0))
 *
 *   • reserve    → reserved += qty        (available shrinks)
 *   • convert    → reserved -= qty, stock -= qty  (unit leaves stock)
 *   • release    → reserved -= qty        (available grows back)
 *
 * `expireStale` runs on a cron (convex/crons.ts) and rolls back any
 * hold older than `expiresAt` so inventory is never locked forever.
 */
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requirePermission } from "./admin";

/** Available-to-promise quantity for a variant row. */
export function availableStock(variant: Doc<"variants">): number {
  return Math.max(0, variant.stock - (variant.reserved ?? 0));
}

/**
 * Reserve `quantity` units of a variant for an order. Throws
 * INSUFFICIENT_STOCK when the hold would exceed available stock.
 */
export async function reserveVariant(
  ctx: MutationCtx,
  args: {
    variant: Doc<"variants">;
    quantity: number;
    orderId?: Id<"orders">;
    userId?: Id<"users">;
    sessionId?: string;
    expiresAt: number;
  }
): Promise<Id<"inventory_reservations">> {
  const available = availableStock(args.variant);
  if (available < args.quantity) {
    throw new Error("INSUFFICIENT_STOCK");
  }
  await ctx.db.patch(args.variant._id, {
    reserved: (args.variant.reserved ?? 0) + args.quantity,
  });
  return await ctx.db.insert("inventory_reservations", {
    variantId: args.variant._id,
    productId: args.variant.productId,
    orderId: args.orderId,
    quantity: args.quantity,
    userId: args.userId,
    sessionId: args.sessionId,
    status: "active",
    expiresAt: args.expiresAt,
    createdAt: Date.now(),
  });
}

/**
 * Convert an active reservation into a real sale: the unit leaves
 * stock (`stock -= qty`, `reserved -= qty`) and a `stock_movements`
 * row is written. Idempotent per reservation.
 */
export async function convertReservation(
  ctx: MutationCtx,
  reservation: Doc<"inventory_reservations">,
  reason: string
): Promise<void> {
  if (reservation.status !== "active") return;
  const variant = await ctx.db.get(reservation.variantId);
  if (!variant) return;
  const held = Math.min(reservation.quantity, variant.reserved ?? 0);
  const newStock = Math.max(0, variant.stock - held);
  await ctx.db.patch(variant._id, {
    stock: newStock,
    reserved: Math.max(0, (variant.reserved ?? 0) - held),
    // A variant that was marked unavailable stays unavailable; one
    // that sells out drops to unavailable.
    available: newStock > 0 ? variant.available : false,
  });
  await ctx.db.insert("stock_movements", {
    variantId: variant._id,
    kind: "sale",
    quantity: -held,
    reason,
    at: Date.now(),
  });
  await ctx.db.patch(reservation._id, { status: "converted" });
}

/**
 * Release a hold back into available stock. Used on payment failure,
 * customer cancellation and cron expiry. Idempotent per reservation.
 */
export async function releaseReservation(
  ctx: MutationCtx,
  reservation: Doc<"inventory_reservations">,
  status: "cancelled" | "expired"
): Promise<void> {
  if (reservation.status !== "active") return;
  const variant = await ctx.db.get(reservation.variantId);
  if (variant) {
    await ctx.db.patch(variant._id, {
      reserved: Math.max(0, (variant.reserved ?? 0) - reservation.quantity),
    });
  }
  await ctx.db.patch(reservation._id, { status });
}

/** All active reservations for a variant — admin inventory view. */
export const activeForVariant = query({
  args: { variantId: v.id("variants") },
  handler: async (ctx: QueryCtx, { variantId }) => {
    await requirePermission(ctx, "manage_inventory");
    return await ctx.db
      .query("inventory_reservations")
      .withIndex("by_variant_status", (q) =>
        q.eq("variantId", variantId).eq("status", "active")
      )
      .collect();
  },
});

/** List active holds across the catalog (admin). */
export const listActive = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, { limit }) => {
    await requirePermission(ctx, "manage_inventory");
    const rows = await ctx.db
      .query("inventory_reservations")
      .withIndex("by_status_expiresAt", (q) => q.eq("status", "active"))
      .collect();
    rows.sort((a, b) => a.expiresAt - b.expiresAt);
    return limit ? rows.slice(0, limit) : rows;
  },
});

async function sweepStale(ctx: MutationCtx) {
  const now = Date.now();
  const stale = await ctx.db
    .query("inventory_reservations")
    .withIndex("by_status_expiresAt", (q) => q.eq("status", "active"))
    .filter((q) => q.lte(q.field("expiresAt"), now))
    .collect();

  const orderIds = new Set<Id<"orders">>();
  for (const reservation of stale) {
    await releaseReservation(ctx, reservation, "expired");
    if (reservation.orderId) orderIds.add(reservation.orderId);
  }

  // Cancel pending orders whose payment window has expired so the
  // order list never shows zombie "pending" rows.
  for (const orderId of orderIds) {
    const order = await ctx.db.get(orderId);
    if (
      order &&
      order.status === "pending" &&
      (order.paymentStatus === "pending" ||
        order.paymentStatus === "initiated" ||
        order.paymentStatus === "redirected")
    ) {
      await ctx.db.patch(orderId, {
        status: "cancelled",
        paymentStatus: "failed",
      });
      await ctx.db.insert("order_status_history", {
        orderId,
        status: "cancelled",
        note: "پرداخت در مهلت مقرر انجام نشد — رزرو موجودی آزاد شد",
        at: Date.now(),
      });
    }
  }
  return { expired: stale.length, cancelledOrders: orderIds.size };
}

/**
 * Cron body — sweep expired holds and the pending orders they belong
 * to. Runs on a Convex interval (convex/crons.ts); also safe to
 * invoke manually for immediate cleanup.
 */
export const expireStale = internalMutation({
  args: {},
  handler: async (ctx) => sweepStale(ctx),
});

/** Manual sweep trigger (admin) — mostly for demo/testing the cron. */
export const runExpiryNow = mutation({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "manage_inventory");
    return await sweepStale(ctx);
  },
});
