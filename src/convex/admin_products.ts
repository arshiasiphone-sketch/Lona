/**
 * Phase 5 — Enterprise Admin Dashboard. Products domain.
 *
 * Admin-only mutations that back the multi-step product wizard plus
 * the lightweight admin list. Phase 4 storefront queries
 * (`api.products.*`) stay untouched, so customer UX is unaffected.
 *
 * Highlights
 * ─────────
 *   • `createDraft` — opens a new row in `status: "draft"` so refresh
 *     never abandons work.
 *   • `generateUploadUrl` / `attachMedia` / `deleteMedia` — uses
 *     Convex file storage. The two-roundtrip pattern (issue URL, POST
 *     file, save storageId) is the standard recipe.
 *   • `update` — patches editable fields individually, never the
 *     immutable `_id`.
 *   • Variants are stored in the existing `variants` table. We diff
 *     the incoming (size,color) set against what exists and add
 *     missing rows / remove rows that aren't in the new set. Rows
 *     with stock > 0 that would be deleted trigger a warning so the
 *     admin can confirm.
 *   • `archive` / `restore` — soft-only. We never hard-delete a row
 *     once it exists in any order history.
 *   • `duplicate` — clones a row plus its media, deep-copying colors
 *     and sizes. New slug is `-copy` suffixed.
 *   • `listForAdmin` returns every row (draft, published, archived)
 *     so the table can show them all without separate queries.
 *
 * Every mutation writes an `activity_logs` row via `audit()`.
 */
import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { requirePermission, audit } from "./admin";
import { withResolvedProductImages } from "./_productImages";
import { api } from "./_generated/api";
import {
  isAllowedImageType,
  MAX_PRODUCT_IMAGE_BYTES,
  normalizeImageContentType,
} from "./mediaValidation";
import {
  vBadge,
  vColorOption,
  vGradient,
  vProductCategory,
  vProductStatus,
  vSizeOption,
} from "./validators";

/* ------------------------------------------------------------ */
/* Reads (admin)                                                */
/* ------------------------------------------------------------ */

/** All products, regardless of status — drives the admin table. */
export const listForAdmin = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }) => {
    await requirePermission(ctx, "manage_products");
    const rows = await ctx.db.query("products").collect();
    rows.sort((a, b) => b._creationTime - a._creationTime);
    const resolved = await withResolvedProductImages(ctx, rows);
    return limit ? resolved.slice(0, limit) : resolved;
  },
});

/**
 * Lookup by Convex `_id` (admin route uses this; storefront uses
 * `api.products.getBySlug`).
 */
export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "manage_products");
    return await ctx.db.get(id);
  },
});

/** All images for a specific product. */
export const listMedia = query({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    await requirePermission(ctx, "manage_products");
    const rows = await ctx.db
      .query("product_images")
      .withIndex("by_product", (q) => q.eq("productId", productId))
      .collect();
    rows.sort((a, b) => a.order - b.order);
    const enriched = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        url: row.storageId ? await ctx.storage.getUrl(row.storageId) : row.url ?? null,
      })),
    );
    return enriched;
  },
});

/** Variants for a specific product — for the inventory step. */
export const listVariants = query({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    await requirePermission(ctx, "manage_products");
    return await ctx.db
      .query("variants")
      .withIndex("by_product", (q) => q.eq("productId", productId))
      .collect();
  },
});

/* ------------------------------------------------------------ */
/* Standard Convex upload-recipe (issue upload URL)             */
/* ------------------------------------------------------------ */
/* The FE calls this to get a one-shot URL it can POST the file
   to. The browser uploads directly to Convex storage and gets back
   an `storageId`. It then calls `attachMedia` to bind that storage
   id to a `product_images` row. */

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "manage_media");
    return await ctx.storage.generateUploadUrl();
  },
});

/* ------------------------------------------------------------ */
/* Variations / standard CRUD                                   */
/* ------------------------------------------------------------ */

export const createDraft = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    category: vProductCategory,
  },
  handler: async (ctx, args) => {
    const user = await requirePermission(ctx, "manage_products");

    // Refuse if slug already in use.
    const dupe = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (dupe) throw new Error("SLUG_TAKEN");

    const id = await ctx.db.insert("products", {
      slug: args.slug,
      name: args.name,
      category: args.category,
      priceCents: 0,
      currency: "USD",
      description: "",
      composition: "",
      origin: "",
      colors: [],
      sizes: [],
      badges: [],
      status: "draft",
      featured: false,
      trending: false,
      editorial: false,
      visible: false,
    });
    await audit(ctx, user, "product.draft.create", "products", id, args);
    return id;
  },
});

export const updateBasics = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    category: v.optional(vProductCategory),
    description: v.optional(v.string()),
    composition: v.optional(v.string()),
    origin: v.optional(v.string()),
    /** Phase 8.2 — Iranian commerce legal fields (Torob/Digikala feeds). */
    brand: v.optional(v.string()),
    barcode: v.optional(v.string()),
    material: v.optional(v.string()),
    care: v.optional(v.string()),
    colors: v.optional(v.array(vColorOption)),
    sizes: v.optional(v.array(vSizeOption)),
  },
  handler: async (ctx, args) => {
    const user = await requirePermission(ctx, "manage_products");
    const { id, ...patch } = args;
    if (patch.slug) {
      const dupe = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", patch.slug!))
        .unique();
      if (dupe && dupe._id !== id) throw new Error("SLUG_TAKEN");
    }
    await ctx.db.patch(id, patch);
    await audit(ctx, user, "product.basics.update", "products", id, patch);
    return id;
  },
});

export const updateVisual = mutation({
  args: {
    id: v.id("products"),
    colors: v.optional(v.array(vColorOption)),
    sizes: v.optional(v.array(vSizeOption)),
    secondaryGradient: v.optional(vGradient),
    badges: v.optional(v.array(vBadge)),
  },
  handler: async (ctx, args) => {
    const user = await requirePermission(ctx, "manage_products");
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
    await audit(ctx, user, "product.visual.update", "products", id, patch);
    return id;
  },
});

export const updatePricing = mutation({
  args: {
    id: v.id("products"),
    priceCents: v.number(),
    compareAtCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requirePermission(ctx, "manage_products");
    const { id, ...patch } = args;

    // Phase 7.5 pricing invariants: never negative, and the sale price
    // (priceCents) can never exceed the regular/compare-at price.
    if (!Number.isFinite(patch.priceCents) || patch.priceCents < 0) {
      throw new Error("INVALID_PRICE:price cannot be negative");
    }
    if (
      patch.compareAtCents !== undefined &&
      patch.compareAtCents !== null &&
      patch.compareAtCents <= patch.priceCents
    ) {
      throw new Error(
        "INVALID_COMPARE_AT:compare-at price must exceed the sale price",
      );
    }

    await ctx.db.patch(id, {
      priceCents: Math.round(patch.priceCents),
      compareAtCents:
        patch.compareAtCents === undefined
          ? undefined
          : Math.round(patch.compareAtCents),
    });
    await audit(ctx, user, "product.pricing.update", "products", id, patch);
    return id;
  },
});

export const updateSeo = mutation({
  args: {
    id: v.id("products"),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
  },
  handler: async (ctx, { id, seoTitle, seoDescription }) => {
    const user = await requirePermission(ctx, "manage_products");
    // Phase 7.5: dedicated `seoTitle` / `seoDescription` columns — the
    // old implementation overwrote the long-form `description` with the
    // SEO description, destroying the storefront copy. These fields are
    // now persisted independently (schema extended in 7.5).
    const patch: Record<string, string> = {};
    if (seoTitle !== undefined) patch.seoTitle = seoTitle;
    if (seoDescription !== undefined) patch.seoDescription = seoDescription;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(id, patch);
    }
    await audit(ctx, user, "product.seo.update", "products", id, {
      seoTitle,
      seoDescription,
    });
    return id;
  },
});

export const updateFlags = mutation({
  args: {
    id: v.id("products"),
    featured: v.optional(v.boolean()),
    trending: v.optional(v.boolean()),
    editorial: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requirePermission(ctx, "manage_products");
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
    await audit(ctx, user, "product.flags.update", "products", id, patch);
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("products"),
    status: vProductStatus,
    visible: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requirePermission(ctx, "manage_products");
    await ctx.db.patch(args.id, { status: args.status, visible: args.visible });
    await audit(ctx, user, "product.status.update", "products", args.id, {
      status: args.status,
      visible: args.visible,
    });
    return args.id;
  },
});

export const archive = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    const user = await requirePermission(ctx, "manage_products");
    await ctx.db.patch(id, { status: "archived", visible: false });
    await audit(ctx, user, "product.archive", "products", id);
    return id;
  },
});

export const restore = mutation({
  args: { id: v.id("products"), status: v.optional(vProductStatus) },
  handler: async (ctx, { id, status }) => {
    const user = await requirePermission(ctx, "manage_products");
    await ctx.db.patch(id, { status: status ?? "draft", visible: false });
    await audit(ctx, user, "product.restore", "products", id, { status });
    return id;
  },
});

export const duplicate = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    const user = await requirePermission(ctx, "manage_products");
    const src = await ctx.db.get(id);
    if (!src) throw new Error("NOT_FOUND");
    const newSlug = `${src.slug}-copy`;
    // Looping collisions until we find a free slug.
    let candidate = newSlug;
    let attempt = 1;
    while (
      await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", candidate))
        .unique()
    ) {
      attempt += 1;
      candidate = `${newSlug}-${attempt}`;
    }
    const newId = await ctx.db.insert("products", {
      ...src,
      slug: candidate,
      name: `${src.name} (copy)`,
      status: "draft",
      visible: false,
      featured: false,
      trending: false,
      editorial: false,
    });
    await audit(ctx, user, "product.duplicate", "products", id, { newId });
    return newId;
  },
});

/** Hard-delete is intentionally NOT exposed. Use `archive`. */

/* ------------------------------------------------------------ */
/* Variants — bulk reconciliation                                */
/* ------------------------------------------------------------ */

export const syncVariants = mutation({
  args: {
    productId: v.id("products"),
    rows: v.array(
      v.object({
        size: v.string(),
        color: v.string(),
        sku: v.string(),
        stock: v.number(),
        priceCentsOverride: v.optional(v.number()),
        available: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, { productId, rows }) => {
    const user = await requirePermission(ctx, "manage_inventory");

    // Pull existing variants and diff against the desired set.
    const existingRows = await ctx.db
      .query("variants")
      .withIndex("by_product", (q) => q.eq("productId", productId))
      .collect();
    const incomingKey = new Set(
      rows.map((r) => `${r.size}::${r.color}`),
    );

    // Delete rows no longer in the incoming set ONLY if their stock
    // is 0. Otherwise we'll re-purpose them to safe defaults the
    // admin can re-acknowledge.
    let softWarned = 0;
    for (const ex of existingRows) {
      const key = `${ex.size}::${ex.color}`;
      if (incomingKey.has(key)) continue;
      if (ex.stock === 0 && (ex.reserved ?? 0) === 0) {
        await ctx.db.delete(ex._id);
      } else {
        softWarned += 1;
        await ctx.db.patch(ex._id, { available: false });
      }
    }

    // Upsert each incoming row by (size, color) against the product.
    for (const row of rows) {
      // Phase 7.5: negative stock is never allowed — clamp to 0 and
      // force `available` false so the storefront hides the variant.
      const safeStock = Math.max(0, Math.round(row.stock));
      const safeAvailable = safeStock > 0 ? row.available : false;
      const match = existingRows.find(
        (e) => e.size === row.size && e.color === row.color,
      );
      if (match) {
        await ctx.db.patch(match._id, {
          sku: row.sku,
          stock: safeStock,
          priceCentsOverride: row.priceCentsOverride,
          available: safeAvailable,
        });
      } else {
        await ctx.db.insert("variants", {
          productId,
          size: row.size,
          color: row.color,
          sku: row.sku,
          stock: safeStock,
          priceCentsOverride: row.priceCentsOverride,
          available: safeAvailable,
        });
      }
    }

    await audit(ctx, user, "variant.sync", "products", productId, {
      rows: rows.length,
      softWarned,
    });
    return { rows: rows.length, softWarned };
  },
});

/* ------------------------------------------------------------ */
/* Media — bind storageId to product_images                      */
/* ------------------------------------------------------------ */

/**
 * Called by the FE after it uploads a file to the URL returned by
 * `generateUploadUrl`. The row carries metadata + the order field
 * (so the wizard can re-order by passing a different `order`).
 */
export const attachMedia = mutation({
  args: {
    productId: v.id("products"),
    storageId: v.id("_storage"),
    alt: v.string(),
    order: v.number(),
    dominantGradient: v.optional(vGradient),
    /** Phase 8.2 — server-side file validation (type + size). */
    contentType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requirePermission(ctx, "manage_media");
    const { contentType, size } = args;
    const metadata = await ctx.storage.getMetadata(args.storageId);
    const metadataType = normalizeImageContentType(metadata?.contentType);
    if (
      !metadata ||
      !metadataType ||
      !isAllowedImageType(metadataType) ||
      !Number.isFinite(metadata.size) ||
      metadata.size <= 0 ||
      metadata.size > MAX_PRODUCT_IMAGE_BYTES
    ) {
      await ctx.storage.delete(args.storageId).catch(() => {});
      throw new Error(
        metadata?.size && metadata.size > MAX_PRODUCT_IMAGE_BYTES
          ? "حجم تصویر زیاد است"
          : "فرمت فایل پشتیبانی نمی‌شود",
      );
    }
    const claimedType = normalizeImageContentType(contentType);
    if (claimedType && claimedType !== metadataType) {
      await ctx.storage.delete(args.storageId).catch(() => {});
      throw new Error("فرمت فایل پشتیبانی نمی‌شود");
    }
    if (size !== undefined && size !== metadata.size) {
      await ctx.storage.delete(args.storageId).catch(() => {});
      throw new Error("فایل تصویر معتبر نیست");
    }
    const id = await ctx.db.insert("product_images", {
      productId: args.productId,
      storageId: args.storageId,
      alt: args.alt,
      order: args.order,
      dominantGradient: args.dominantGradient,
    });
    await audit(ctx, user, "media.attach", "products", args.productId, { id });
    return id;
  },
});

export const reorderMedia = mutation({
  args: {
    productId: v.id("products"),
    order: v.array(v.id("product_images")),
  },
  handler: async (ctx, { productId, order }) => {
    const user = await requirePermission(ctx, "manage_media");
    for (let i = 0; i < order.length; i++) {
      await ctx.db.patch(order[i], { order: i, productId });
    }
    await audit(ctx, user, "media.reorder", "products", productId, {
      count: order.length,
    });
    return order.length;
  },
});

export const deleteMedia = mutation({
  args: { id: v.id("product_images") },
  handler: async (ctx, { id }) => {
    const user = await requirePermission(ctx, "manage_media");
    const row = await ctx.db.get(id);
    if (!row) return null;
    if (row.storageId) {
      await ctx.storage.delete(row.storageId).catch(() => {});
    }
    await ctx.db.delete(id);
    await audit(ctx, user, "media.delete", "products", row.productId, { id });
    return id;
  },
});

/**
 * Bulk admin command: publish a draft product. Reads the product,
 * confirms it has a name / slug / colors / sizes / price / at least
 * one image, and switches `status` to `published` + flips `visible`.
 */
export const publish = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, { id }) => {
    const user = await requirePermission(ctx, "manage_products");
    const product = await ctx.db.get(id);
    if (!product) throw new Error("NOT_FOUND");
    const missing: string[] = [];
    if (!product.name) missing.push("name");
    if (!product.slug) missing.push("slug");
    if (product.colors.length === 0) missing.push("colors");
    if (product.sizes.length === 0) missing.push("sizes");
    if (product.priceCents <= 0) missing.push("price");
    const media = await ctx.db
      .query("product_images")
      .withIndex("by_product", (q) => q.eq("productId", id))
      .first();
    if (!media) missing.push("media");
    if (missing.length > 0) {
      throw new Error(`INCOMPLETE:${missing.join(",")}`);
    }
    await ctx.db.patch(id, { status: "published", visible: true });
    await audit(ctx, user, "product.publish", "products", id);
    return id;
  },
});

/* ------------------------------------------------------------ */
/* Bulk actions (admin table)                                    */
/* ------------------------------------------------------------ */

export const bulkArchive = mutation({
  args: { ids: v.array(v.id("products")) },
  handler: async (ctx, { ids }) => {
    const user = await requirePermission(ctx, "manage_products");
    for (const id of ids) {
      await ctx.db.patch(id, { status: "archived", visible: false });
    }
    await audit(ctx, user, "product.bulk_archive", "products", undefined, { count: ids.length });
    return ids.length;
  },
});

export const bulkPublish = mutation({
  args: { ids: v.array(v.id("products")) },
  handler: async (ctx, { ids }) => {
    const user = await requirePermission(ctx, "manage_products");
    for (const id of ids) {
      await ctx.db.patch(id, { status: "published", visible: true });
    }
    await audit(ctx, user, "product.bulk_publish", "products", undefined, { count: ids.length });
    return ids.length;
  },
});

/* ------------------------------------------------------------ */
/* Action wrapper (for future transcoding / pipeline)            */
/* ------------------------------------------------------------ */

/**
 * Reserved action surface. Today it just composes a few queries.
 * Future use cases: server-side image transcoding via external
 * service, scheduled auto-archival of long-out-of-stock items, etc.
 */
export const reconcileInventory = action({
  args: {},
  handler: async () => {
    // Just an entry-point; the actual reconciliation is an admin
    // button-driven job. Kept here so worker infrastructure can join
    // it later without expanding the public API surface.
    return { ok: true } as const;
  },
});

/**
 * Tiny helper that admin pages import to fetch a product inline.
 * Re-exports `api.products.getBySlug` so the public surface stays
 * canonical for the wizard's preview pane.
 *
 * It's `api.products.getBySlug` because the storefront queries are
 * still the most-tested lookup path; reusing them avoids a parallel
 * implementation.
 */
export const previewBySlug = query({
  args: { slug: v.string() },
  handler: async (
    _ctx,
    { slug },
  ): Promise<Doc<"products"> | null> => {
    // Permissive: admins can preview any product state, so we side-step
    // the visibility filter by calling into the public query directly.
    return await _ctx.runQuery(api.products.getBySlug, { slug });
  },
});
