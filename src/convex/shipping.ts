/**
 * Phase 8.1 — shipping methods.
 *
 * Admin-managed delivery catalog that the checkout reads for cost +
 * ETA. The chosen method is snapshotted onto the order at placement
 * (`shipping.method` + `shippingMethodName`), so historical orders
 * never drift when prices are edited later.
 *
 * Seeded defaults: ارسال عادی / ارسال سریع / پیک شهری.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requirePermission, audit } from "./admin";

/** Active methods ordered by display priority — public read. */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("shipping_methods")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    rows.sort((a, b) => a.order - b.order);
    return rows;
  },
});

/** All methods (including inactive) — admin read. */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "manage_settings");
    const rows = await ctx.db.query("shipping_methods").collect();
    rows.sort((a, b) => a.order - b.order);
    return rows;
  },
});

/** Resolve cost + name for a method code with a safe fallback. */
export async function getByCode(
  ctx: { db: import("./_generated/server").DatabaseReader },
  code: string
): Promise<{ priceCents: number; name: string } | null> {
  const row = await ctx.db
    .query("shipping_methods")
    .withIndex("by_code", (q) => q.eq("code", code))
    .unique();
  if (!row || !row.active) return null;
  return { priceCents: row.priceCents, name: row.name };
}

/** Admin upsert — used by the Settings panel and the seed. */
export const upsert = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    priceCents: v.number(),
    estimatedDays: v.number(),
    active: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requirePermission(ctx, "manage_settings");
    const existing = await ctx.db
      .query("shipping_methods")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      await audit(ctx, user, "shipping.update", "shipping_methods", existing._id, args);
      return existing._id;
    }
    const id = await ctx.db.insert("shipping_methods", args);
    await audit(ctx, user, "shipping.create", "shipping_methods", id, args);
    return id;
  },
});
