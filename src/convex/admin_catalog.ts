/**
 * Phase 5 — Enterprise Admin Dashboard. Catalog & Content domains.
 *
 * Combined admin surface for the four content / taxonomy tables
 * that don't yet require their own full slice: categories,
 * collections, coupons, editorials. Each follows the same pattern
 * (`listForAdmin`, `getById`, `create`, `update`, `archive`,
 * `delete` where applicable) and every mutation writes
 * `activity_logs`.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requirePermission, audit } from "./admin";
import {
  vBadge,
  vEditorialKind,
  vGradient,
  vProductCategory,
  vProductStatus,
} from "./validators";

/* ────────────────────────────────────────────────────────────
 * CATEGORIES
 * ──────────────────────────────────────────────────────────── */

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "manage_products");
    return await ctx.db.query("categories").collect();
  },
});

export const createCategory = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    order: v.number(),
    visible: v.boolean(),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requirePermission(ctx, "manage_products");
    const { seoTitle, seoDescription, ...rest } = args;
    const id = await ctx.db.insert("categories", {
      ...rest,
      seo: { title: seoTitle, description: seoDescription },
    });
    await audit(ctx, user, "category.create", "categories", id, args);
    return id;
  },
});

export const updateCategory = mutation({
  args: {
    id: v.id("categories"),
    slug: v.optional(v.string()),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    order: v.optional(v.number()),
    visible: v.optional(v.boolean()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
  },
  handler: async (ctx, { id, seoTitle, seoDescription, ...patch }) => {
    const user = await requirePermission(ctx, "manage_products");
    await ctx.db.patch(id, patch);
    if (seoTitle !== undefined || seoDescription !== undefined) {
      const cur = await ctx.db.get(id);
      await ctx.db.patch(id, {
        seo: { ...(cur?.seo ?? {}), title: seoTitle, description: seoDescription },
      });
    }
    await audit(ctx, user, "category.update", "categories", id, patch);
    return id;
  },
});

export const archiveCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => {
    const user = await requirePermission(ctx, "manage_products");
    const cat = await ctx.db.get(id);
    if (!cat) return null;
    await ctx.db.patch(id, { visible: false });
    await audit(ctx, user, "category.archive", "categories", id);
    return id;
  },
});

/* ────────────────────────────────────────────────────────────
 * COLLECTIONS
 * ──────────────────────────────────────────────────────────── */

export const listCollectionsForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "manage_products");
    return await ctx.db.query("collections").collect();
  },
});

export const getCollectionById = query({
  args: { id: v.id("collections") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "manage_products");
    return await ctx.db.get(id);
  },
});

export const upsertCollection = mutation({
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
      v.literal("permanent"),
    ),
    season: v.optional(v.string()),
    order: v.number(),
    visible: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requirePermission(ctx, "manage_products");
    const existing = await ctx.db
      .query("collections")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    let id = existing?._id;
    if (existing) {
      await ctx.db.patch(id!, args);
    } else {
      id = await ctx.db.insert("collections", args);
    }
    await audit(ctx, user, "collection.upsert", "collections", id!, args);
    return id!;
  },
});

/* ────────────────────────────────────────────────────────────
 * COUPONS
 * ──────────────────────────────────────────────────────────── */

export const listCoupons = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "manage_coupons");
    return await ctx.db.query("coupons").collect();
  },
});

export const upsertCoupon = mutation({
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
    const user = await requirePermission(ctx, "manage_coupons");
    const code = args.code.trim().toUpperCase();
    const existing = await ctx.db
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    let id = existing?._id;
    if (existing) {
      await ctx.db.patch(id!, {
        ...args,
        code,
        usedCount: existing.usedCount,
      });
    } else {
      id = await ctx.db.insert("coupons", { ...args, code, usedCount: 0 });
    }
    await audit(ctx, user, "coupon.upsert", "coupons", id!, args);
    return id!;
  },
});

export const archiveCoupon = mutation({
  args: { id: v.id("coupons") },
  handler: async (ctx, { id }) => {
    const user = await requirePermission(ctx, "manage_coupons");
    await ctx.db.patch(id, { active: false });
    await audit(ctx, user, "coupon.archive", "coupons", id);
    return id;
  },
});

/* ────────────────────────────────────────────────────────────
 * EDITORIALS
 * ──────────────────────────────────────────────────────────── */

export const listEditorialsForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "manage_content");
    return await ctx.db.query("editorials").collect();
  },
});

export const upsertEditorial = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    excerpt: v.string(),
    body: v.optional(v.string()),
    coverGradient: vGradient,
    kind: vEditorialKind,
    author: v.string(),
    publishedAt: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    ),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requirePermission(ctx, "manage_content");
    const existing = await ctx.db
      .query("editorials")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    let id = existing?._id;
    if (existing) {
      await ctx.db.patch(id!, args);
    } else {
      id = await ctx.db.insert("editorials", args);
    }
    await audit(ctx, user, "editorial.upsert", "editorials", id!, args);
    return id!;
  },
});

export const archiveEditorial = mutation({
  args: { id: v.id("editorials") },
  handler: async (ctx, { id }) => {
    const user = await requirePermission(ctx, "manage_content");
    await ctx.db.patch(id, { status: "archived" });
    await audit(ctx, user, "editorial.archive", "editorials", id);
    return id;
  },
});

/* ────────────────────────────────────────────────────────────
 * Shared "delete is archive" helper for non-product tables.
 * Admin products have `archive` which we kept hard-vs-soft.
 * For these reference tables we do not expose a delete mutation;
 * we always archive so historical references survive.
 * ──────────────────────────────────────────────────────────── */

/** Re-export domain literals so FE imports stay curated. */
export const productStatusLiterals = ["draft", "published", "archived"] as const;
export const editorialKindLiterals = [
  "journal",
  "atelier",
  "campaign",
  "blog",
] as const;

// Lightweight type shims re-used by the FE editor step files.
export const collectionKinds = [
  "seasonal",
  "campaign",
  "editorial",
  "permanent",
] as const;

// Mirror for FE badge literals so the FE doesn't import from
// `convex/values` directly.
export const badgeLiterals = [
  "new",
  "restocked",
  "limited",
  "editorial",
  "exclusive",
] as const;

// Re-export category/product status literals for FE convenience.
export const statusLiterals = productStatusLiterals;

// Suppress unused-locals warnings for import surfaces exclusively
// used elsewhere.
export const _suppress = { vBadge, vProductCategory, vProductStatus };
