/**
 * Coupons table — public read so cart and checkout can validate codes;
 * mutations are admin-gated.
 */
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./_helpers";

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const upper = code.trim().toUpperCase();
    const row = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", upper))
      .unique();
    if (!row) return null;
    if (!row.active) return null;
    if (row.validFrom && Date.now() < row.validFrom) return null;
    if (row.validUntil && Date.now() > row.validUntil) return null;
    if (row.maxUses !== undefined && row.usedCount >= row.maxUses) return null;
    return row;
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("coupons").collect();
    return all.filter((c) => c.active);
  },
});

export const upsert = mutation({
  args: {
    code: v.string(),
    percentOff: v.number(),
    description: v.optional(v.string()),
    active: v.boolean(),
    validFrom: v.optional(v.number()),
    validUntil: v.optional(v.number()),
    maxUses: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const upper = args.code.trim().toUpperCase();
    const existing = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", upper))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        code: upper,
        usedCount: existing.usedCount,
      });
      return existing._id;
    }
    return await ctx.db.insert("coupons", {
      ...args,
      code: upper,
      usedCount: 0,
    });
  },
});

/**
 * Marks a code as used.
 *
 * Phase 7.5 hardening: order placement increments the counter inline
 * inside `orders.place`; this standalone counter was left publicly
 * callable, letting any signed-in user inflate usage stats. Kept for
 * manual admin corrections only and now admin-gated.
 */
export const incrementUsage = mutation({
  args: { id: v.id("coupons") },
  handler: async (ctx, { id }) => {
    await requireAdmin(ctx);
    const row = await ctx.db.get(id);
    if (!row) return;
    await ctx.db.patch(id, { usedCount: row.usedCount + 1 });
  },
});
