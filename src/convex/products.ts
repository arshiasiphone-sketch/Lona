/**
 * Convex queries + mutations for the product catalog.
 *
 * Read-side uses indexes + the `search_name` searchIndex. Mutations
 * are admin-gated — the customer app never writes here, only the seed
 * action and (in a later phase) the admin dashboard.
 */
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./_helpers";
import { withResolvedProductImages } from "./_productImages";
import {
  badgeLiterals,
  vBadge,
  vColorOption,
  vGradient,
  vProductCategory,
  vProductStatus,
  vSizeOption,
} from "./validators";

/* -------------------------------------------------------------- */
/* Queries                                                          */
/* -------------------------------------------------------------- */

/** Return all visible, published products. */
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }) => {
    const rows = await ctx.db
      .query("products")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
    const visible = rows.filter((p) => p.visible);
    const resolved = await withResolvedProductImages(ctx, visible);
    return limit ? resolved.slice(0, limit) : resolved;
  },
});

/**
 * Phase 7.5: shared visibility gate — storefront listings must never
 * leak drafts / archived rows. Applied to the flag-driven queries that
 * previously returned every row matching the flag regardless of
 * `status` / `visible`.
 */
async function publishedOnly<T extends { visible: boolean; status: string }>(
  rows: T[]
): Promise<T[]> {
  return rows.filter((p) => p.visible && p.status === "published");
}

/** Featured products — drives the home featured grid. */
export const featured = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("products")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect();
    return await withResolvedProductImages(ctx, await publishedOnly(rows));
  },
});

/** Trending products — drives TrendingProducts carousel. */
export const trending = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("products")
      .withIndex("by_trending", (q) => q.eq("trending", true))
      .collect();
    return await withResolvedProductImages(ctx, await publishedOnly(rows));
  },
});

/** Editorial-piece picker. */
export const editorial = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("products")
      .withIndex("by_editorial", (q) => q.eq("editorial", true))
      .collect();
    return await withResolvedProductImages(ctx, await publishedOnly(rows));
  },
});

/** Products in a specific category. */
export const byCategory = query({
  args: { category: vProductCategory },
  handler: async (ctx, { category }) => {
    const rows = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", category))
      .collect();
    return await withResolvedProductImages(ctx, await publishedOnly(rows));
  },
});

/** Look a single product up by slug. */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!product) return null;
    const [resolved] = await withResolvedProductImages(ctx, [product]);
    return resolved ?? null;
  },
});

/**
 * Search products by name. Uses the searchIndex for tokenized matching.
 * Optional filters narrow to category / visible rows.
 */
export const search = query({
  args: {
    query: v.string(),
    category: v.optional(vProductCategory),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query: term, category, limit }) => {
    const rows = await ctx.db
      .query("products")
      .withSearchIndex("search_name", (q) => {
        const base = q.search("name", term).eq("status", "published").eq("visible", true);
        return category ? base.eq("category", category) : base;
      })
      .take(limit ?? 24);
    return await withResolvedProductImages(ctx, rows);
  },
});

/* -------------------------------------------------------------- */
/* Mutations (admin-gated)                                         */
/* -------------------------------------------------------------- */

/** Upsert by slug — used by the seed action and the admin dashboard. */
export const upsertBySlug = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    category: vProductCategory,
    priceCents: v.number(),
    compareAtCents: v.optional(v.number()),
    currency: v.literal("USD"),
    description: v.string(),
    composition: v.string(),
    origin: v.string(),
    colors: v.array(vColorOption),
    sizes: v.array(vSizeOption),
    badges: v.array(vBadge),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    secondaryGradient: v.optional(vGradient),
    imageUrls: v.optional(v.array(v.string())),
    status: vProductStatus,
    featured: v.boolean(),
    trending: v.boolean(),
    editorial: v.boolean(),
    visible: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      // `currency` is constant for the demo — patched for completeness.
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("products", args);
  },
});

/** Soft-archive by slug — never deletes the row so historical orders stay coherent. */
export const archive = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    await requireAdmin(ctx);
    const row = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!row) return null;
    await ctx.db.patch(row._id, { status: "archived", visible: false });
    return row._id;
  },
});

// Re-export the badge literal type so consumers can import it from here.
export type Badge = (typeof badgeLiterals)[number];
