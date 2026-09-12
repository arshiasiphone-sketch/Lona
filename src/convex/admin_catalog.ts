/**
 * Phase 5 — Enterprise Admin Dashboard. Catalog & Content domains.
 *
 * Combined admin surface for the content / taxonomy tables
 * that don't yet require their own full slice: categories,
 * coupons, editorials. Each follows the same pattern
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

/** Restore an archived / hidden category back to visible. */
export const restoreCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => {
    const user = await requirePermission(ctx, "manage_products");
    await ctx.db.patch(id, { visible: true });
    await audit(ctx, user, "category.restore", "categories", id);
    return id;
  },
});

/**
 * Bulk reorder categories — atomic reorder of `order` field. The
 * caller (tree UI) supplies ids in the new top-to-bottom order.
 */
export const reorderCategories = mutation({
  args: { order: v.array(v.id("categories")) },
  handler: async (ctx, { order }) => {
    const user = await requirePermission(ctx, "manage_products");
    for (let i = 0; i < order.length; i++) {
      await ctx.db.patch(order[i], { order: i });
    }
    await audit(ctx, user, "category.reorder", "categories", undefined, {
      count: order.length,
    });
    return order.length;
  },
});

/**
 * Counts products linked to a category. Used by the admin UI to
 * surface a delete-safety confirmation when a category still holds
 * inventory we don't want to orphan.
 */
export const categoryProductCount = query({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "manage_products");
    const slug = await ctx.db.get(id);
    if (!slug) return 0;
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) =>
        q.eq("category", slug.name as Parameters<typeof q.eq>[1]),
      )
      .collect();
    return products.length;
  },
});

/**
 * Hard-delete with safety. Refuses if any product is still tagged
 * with this category's name; the admin must archive or move products
 * first. We never hard-delete categories that still hold products,
 * because the storefront's product filter would 404 on stale slugs.
 */
export const deleteCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, { id }) => {
    const user = await requirePermission(ctx, "manage_products");
    const cat = await ctx.db.get(id);
    if (!cat) return { deleted: false as const };
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) =>
        q.eq("category", cat.name as Parameters<typeof q.eq>[1]),
      )
      .collect();
    if (products.length > 0) {
      throw new Error(
        `CATEGORY_NOT_EMPTY:${products.length} products still linked`,
      );
    }
    await ctx.db.delete(id);
    await audit(ctx, user, "category.delete", "categories", id);
    return { deleted: true as const };
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

/** Re-enable a soft-archived coupon. */
export const enableCoupon = mutation({
  args: { id: v.id("coupons") },
  handler: async (ctx, { id }) => {
    const user = await requirePermission(ctx, "manage_coupons");
    await ctx.db.patch(id, { active: true });
    await audit(ctx, user, "coupon.enable", "coupons", id);
    return id;
  },
});

/**
 * Hard-delete a coupon. Coupons have no FK enforcement from
 * other tables so we let the admin wipe a mistaken or test row
 * without manual DB access. UsedCount is preserved in the audit
 * metadata so historical reports still trace the deletion.
 */
export const deleteCoupon = mutation({
  args: { id: v.id("coupons") },
  handler: async (ctx, { id }) => {
    const user = await requirePermission(ctx, "manage_coupons");
    const coupon = await ctx.db.get(id);
    if (!coupon) return { deleted: false as const };
    await ctx.db.delete(id);
    await audit(ctx, user, "coupon.delete", "coupons", id, {
      code: coupon.code,
      usedCount: coupon.usedCount,
    });
    return { deleted: true as const };
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
    coverImage: v.optional(v.string()),
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

/**
 * Publish a draft editorial — flips status to "published" and stamps
 * the publish time so the storefront `editorials.ts` query picks it
 * up.
 */
export const publishEditorial = mutation({
  args: { id: v.id("editorials") },
  handler: async (ctx, { id }) => {
    const user = await requirePermission(ctx, "manage_content");
    const ed = await ctx.db.get(id);
    if (!ed) throw new Error("NOT_FOUND");
    await ctx.db.patch(id, {
      status: "published",
      publishedAt: Date.now(),
    });
    await audit(ctx, user, "editorial.publish", "editorials", id);
    return id;
  },
});

/**
 * Move a published editorial back to draft so the storefront hides
 * it during edits.
 */
export const unpublishEditorial = mutation({
  args: { id: v.id("editorials") },
  handler: async (ctx, { id }) => {
    const user = await requirePermission(ctx, "manage_content");
    await ctx.db.patch(id, { status: "draft" });
    await audit(ctx, user, "editorial.unpublish", "editorials", id);
    return id;
  },
});

/**
 * Hard-delete an editorial. No product referential
 * integrity to enforce (editorials reference products by slug in
 * copy but the FK is loose), so we just remove the row.
 */
export const deleteEditorial = mutation({
  args: { id: v.id("editorials") },
  handler: async (ctx, { id }) => {
    const user = await requirePermission(ctx, "manage_content");
    await ctx.db.delete(id);
    await audit(ctx, user, "editorial.delete", "editorials", id);
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
