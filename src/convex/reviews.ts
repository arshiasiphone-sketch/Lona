/**
 * Reviews + questions — public read; only authed users can write.
 *
 * `productId` is an opaque string (matches the FE catalog ids like
 * "p-001") — see the comment on `carts.lines.productId` in schema.ts.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function getOptionalUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

export const byProduct = query({
  args: {
    productId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { productId, limit }) => {
    const rows = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", productId))
      .collect();
    const published = rows.filter((r) => r.status === "published");
    published.sort((a, b) => b.createdAt - a.createdAt);
    return limit ? published.slice(0, limit) : published;
  },
});

/** Aggregate star rating — fed back into the product card / detail star. */
export const summaryByProduct = query({
  args: { productId: v.string() },
  handler: async (ctx, { productId }) => {
    const rows = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", productId))
      .collect();
    const pub = rows.filter((r) => r.status === "published");
    if (pub.length === 0) {
      return { rating: null, count: 0 };
    }
    const avg = pub.reduce((sum, r) => sum + r.rating, 0) / pub.length;
    return { rating: Number(avg.toFixed(2)), count: pub.length };
  },
});

export const create = mutation({
  args: {
    productId: v.string(),
    rating: v.number(),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalUser(ctx);
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("INVALID_RATING");
    }
    return await ctx.db.insert("reviews", {
      productId: args.productId,
      userId: user?._id,
      rating: args.rating,
      title: args.title,
      body: args.body,
      verified: Boolean(user),
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

/* Questions ------------------------------------------------------ */

export const questionsByProduct = query({
  args: { productId: v.string() },
  handler: async (ctx, { productId }) => {
    const rows = await ctx.db
      .query("questions")
      .withIndex("by_product", (q) => q.eq("productId", productId))
      .collect();
    return rows.filter((q) => q.status !== "archived");
  },
});

export const ask = mutation({
  args: {
    productId: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHORIZED");
    return await ctx.db.insert("questions", {
      productId: args.productId,
      userId,
      body: args.body,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});
