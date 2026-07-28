/**
 * Collections table — seasonal / campaign / editorial / permanent.
 * `productSlugs` is denormalized for FE convenience; the canonical
 * M:N is `product_collections`.
 */
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./_helpers";
import { vGradient } from "./validators";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("collections")
      .withIndex("by_visible", (q) => q.eq("visible", true))
      .collect();
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("collections").collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("collections")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const byKind = query({
  args: {
    kind: v.union(
      v.literal("seasonal"),
      v.literal("campaign"),
      v.literal("editorial"),
      v.literal("permanent")
    ),
  },
  handler: async (ctx, { kind }) => {
    return await ctx.db
      .query("collections")
      .withIndex("by_kind", (q) => q.eq("kind", kind))
      .collect();
  },
});

/**
 * Upsert by slug. The mutation also reconciles `product_collections`
 * join rows so the (M:N) view stays canonical.
 */
export const upsertBySlug = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    eyebrow: v.string(),
    description: v.string(),
    productSlugs: v.array(v.string()),
    gradient: vGradient,
    coverGradient: v.optional(vGradient),
    kind: v.union(
      v.literal("seasonal"),
      v.literal("campaign"),
      v.literal("editorial"),
      v.literal("permanent")
    ),
    season: v.optional(v.string()),
    order: v.number(),
    visible: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    // 1. resolve product IDs from slug list
    const products = [];
    for (const slug of args.productSlugs) {
      const p = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .unique();
      if (p) products.push({ id: p._id, slug });
    }

    // 2. upsert the collection
    const existing = await ctx.db
      .query("collections")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    let collectionId;
    if (existing) {
      await ctx.db.patch(existing._id, args);
      collectionId = existing._id;
    } else {
      collectionId = await ctx.db.insert("collections", args);
    }

    // 3. reconjoin: delete prior links, write fresh
    const links = await ctx.db
      .query("product_collections")
      .withIndex("by_collection", (q) => q.eq("collectionId", collectionId))
      .collect();
    for (const link of links) {
      await ctx.db.delete(link._id);
    }
    for (let i = 0; i < products.length; i++) {
      await ctx.db.insert("product_collections", {
        productId: products[i].id,
        collectionId,
        order: i,
      });
    }
    return collectionId;
  },
});
