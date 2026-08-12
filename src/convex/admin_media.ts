/**
 * Phase 5.2 — Admin media library.
 *
 * The existing `product_images` table handles anything tied to a
 * product. This module adds a separate `media_library` table for
 * brand assets that don't belong to a specific product (editorial
 * cover images, homepage hero crops, marketing banners, Instagram
 * shots, lookbook covers). The admin media page renders both in
 * one unified grid so the team can browse the full asset pool.
 *
 * Follows the same permission + audit pattern as Phase 5.1:
 *   • `requirePermission("manage_media")` on every mutation.
 *   • `audit()` writes an `activity_logs` row on every write.
 *   • Storage lifecycle mirrors `admin_products.attachMedia`:
 *     client gets an upload URL → POSTs the file → calls
 *     `attachToLibrary` with the returned storageId.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requirePermission, audit } from "./admin";
import {
  isAllowedImageType,
  MAX_LIBRARY_IMAGE_BYTES,
  normalizeImageContentType,
} from "./mediaValidation";

/* ────────────────────────────────────────────────────────────
 * SERVER-SIDE FILE VALIDATION (Phase 8.2) — never trust the
 * client. Every attach / replace path validates content type
 * and size before persisting, with Persian error messages.
 * ──────────────────────────────────────────────────────────── */

async function assertImageMeta(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
  claimedType?: string,
  claimedSize?: number,
) {
  // The client-provided MIME and size are hints only. Convex storage
  // metadata is the server-side source of truth after the upload.
  const metadata = await ctx.storage.getMetadata(storageId);
  const metadataType = normalizeImageContentType(metadata?.contentType);
  if (!metadata || !metadataType || !isAllowedImageType(metadataType)) {
    await ctx.storage.delete(storageId).catch(() => {});
    throw new Error("فرمت فایل پشتیبانی نمی‌شود");
  }
  if (
    !Number.isFinite(metadata.size) ||
    metadata.size <= 0 ||
    metadata.size > MAX_LIBRARY_IMAGE_BYTES
  ) {
    await ctx.storage.delete(storageId).catch(() => {});
    throw new Error("حجم تصویر زیاد است");
  }
  const claimed = normalizeImageContentType(claimedType);
  if (claimed && claimed !== metadataType) {
    await ctx.storage.delete(storageId).catch(() => {});
    throw new Error("فرمت فایل پشتیبانی نمی‌شود");
  }
  if (claimedSize !== undefined && claimedSize !== metadata.size) {
    await ctx.storage.delete(storageId).catch(() => {});
    throw new Error("فایل تصویر معتبر نیست");
  }
  return { contentType: metadataType, size: metadata.size };
}

/* ────────────────────────────────────────────────────────────
 * UPLOAD URL  — identical recipe to admin_products.* so the FE
 * can reuse the same upload-XHR code on the media page.
 * ──────────────────────────────────────────────────────────── */

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "manage_media");
    return await ctx.storage.generateUploadUrl();
  },
});

/** Remove a just-uploaded file when the following attach step fails. */
export const discardUpload = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const user = await requirePermission(ctx, "manage_media");
    const [libraryRows, productRows] = await Promise.all([
      ctx.db.query("media_library").collect(),
      ctx.db.query("product_images").collect(),
    ]);
    const isReferenced =
      libraryRows.some((row) => row.storageId === storageId) ||
      productRows.some((row) => row.storageId === storageId);
    if (isReferenced) {
      throw new Error("فایل در حال استفاده است");
    }
    await ctx.storage.delete(storageId).catch(() => {});
    await audit(ctx, user, "media.upload.discard", "_storage", storageId);
    return storageId;
  },
});

/* ────────────────────────────────────────────────────────────
 * ATTACH  — bind a freshly uploaded file to the library table
 * (no productId required). Accepts optional metadata the FE
 * extracted from the file (image dimensions, mime type).
 * ──────────────────────────────────────────────────────────── */

export const attachToLibrary = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    alt: v.string(),
    caption: v.optional(v.string()),
    section: v.optional(
      v.union(
        v.literal("brand"),
        v.literal("editorial"),
        v.literal("instagram"),
        v.literal("banner"),
        v.literal("general")
      )
    ),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    contentType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requirePermission(ctx, "manage_media");
    const fileMeta = await assertImageMeta(
      ctx,
      args.storageId,
      args.contentType,
      args.size,
    );
    const id = await ctx.db.insert("media_library", {
      ...args,
      section: args.section ?? "general",
      contentType: fileMeta.contentType,
      size: fileMeta.size,
      uploadedAt: Date.now(),
    });
    const url = await ctx.storage.getUrl(args.storageId);
    await audit(ctx, user, "media.library.attach", "media_library", id, {
      filename: args.filename,
    });
    return { id, url };
  },
});

/* ────────────────────────────────────────────────────────────
 * LIST  — unified view across media_library and every
 * product_images row, so the admin can see the whole pool in
 * one grid and tag / re-use an asset against any product.
 * ──────────────────────────────────────────────────────────── */

export const listLibrary = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { search, limit }) => {
    await requirePermission(ctx, "manage_media");

    const libraryRows = await ctx.db.query("media_library").collect();
    const productRows = await ctx.db.query("product_images").collect();

    const library = await Promise.all(
      libraryRows.map(async (row) => ({
        id: row._id,
        source: "library" as const,
        filename: row.filename,
        alt: row.alt,
        caption: row.caption ?? null,
        section: row.section ?? null,
        url: await ctx.storage.getUrl(row.storageId),
        width: row.width ?? null,
        height: row.height ?? null,
        uploadedAt: row.uploadedAt,
        contentType: row.contentType ?? null,
      })),
    );

    const products = await ctx.db.query("products").collect();
    const productIndex = new Map(products.map((p) => [p._id, p]));

    const attached = await Promise.all(
      productRows.map(async (row) => ({
        id: row._id,
        source: "product" as const,
        filename: row.alt,
        alt: row.alt,
        url: row.storageId
          ? await ctx.storage.getUrl(row.storageId)
          : row.url ?? null,
        width: row.width ?? null,
        height: row.height ?? null,
        uploadedAt: row._creationTime,
        productSlug: productIndex.get(row.productId)?.slug ?? null,
        productName: productIndex.get(row.productId)?.name ?? null,
        order: row.order,
      })),
    );

    const all = [...library, ...attached].sort(
      (a, b) => b.uploadedAt - a.uploadedAt,
    );

    const needle = search?.trim().toLowerCase() ?? "";
    const filtered = needle
      ? all.filter(
          (row) =>
            row.alt.toLowerCase().includes(needle) ||
            row.filename.toLowerCase().includes(needle),
        )
      : all;

    return limit ? filtered.slice(0, limit) : filtered;
  },
});

/* ────────────────────────────────────────────────────────────
 * REPLACE  — swap the file behind an existing library entry.
 * Keeps the same row (alt, caption, section, dimensions) so
 * placements that reference this asset keep working; the old
 * storage file is deleted to avoid orphans.
 * ──────────────────────────────────────────────────────────── */

export const replaceLibraryAsset = mutation({
  args: {
    id: v.id("media_library"),
    storageId: v.id("_storage"),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    contentType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, { id, storageId, ...meta }) => {
    const user = await requirePermission(ctx, "manage_media");
    const row = await ctx.db.get(id);
    if (!row) {
      await ctx.storage.delete(storageId).catch(() => {});
      return null;
    }
    const fileMeta = await assertImageMeta(
      ctx,
      storageId,
      meta.contentType,
      meta.size,
    );
    const oldStorage = row.storageId;
    await ctx.db.patch(id, {
      storageId,
      ...meta,
      contentType: fileMeta.contentType,
      size: fileMeta.size,
    });
    if (oldStorage && oldStorage !== storageId) {
      await ctx.storage.delete(oldStorage).catch(() => {});
    }
    const url = await ctx.storage.getUrl(storageId);
    await audit(ctx, user, "media.library.replace", "media_library", id);
    return { id, url };
  },
});

/* ────────────────────────────────────────────────────────────
 * DELETE  — library entry. Storage row is deleted with the
 * row so we don't leak orphan files in `_storage`.
 * ──────────────────────────────────────────────────────────── */

export const deleteLibraryAsset = mutation({
  args: { id: v.id("media_library") },
  handler: async (ctx, { id }) => {
    const user = await requirePermission(ctx, "manage_media");
    const row = await ctx.db.get(id);
    if (!row) return null;
    await ctx.storage.delete(row.storageId).catch(() => {});
    await ctx.db.delete(id);
    await audit(ctx, user, "media.library.delete", "media_library", id);
    return id;
  },
});

/* ────────────────────────────────────────────────────────────
 * EDIT ALT  — light-weight alt-text correction without
 * re-uploading. Persisted on the library row. Editorial / SEO
 * workflows need this frequently.
 * ──────────────────────────────────────────────────────────── */

export const updateLibraryAlt = mutation({
  args: {
    id: v.id("media_library"),
    alt: v.string(),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, { id, alt, caption }) => {
    const user = await requirePermission(ctx, "manage_media");
    const cleanAlt = alt.trim();
    if (!cleanAlt) throw new Error("متن جایگزین تصویر الزامی است");
    await ctx.db.patch(id, { alt: cleanAlt, caption: caption?.trim() });
    await audit(ctx, user, "media.library.updateAlt", "media_library", id, {
      alt: cleanAlt,
    });
    return id;
  },
});

/* ────────────────────────────────────────────────────────────
 * STATS  — used by the dashboard chip. Counts both tables
 * and returns orphans (storage <-> row mismatch).
 * ──────────────────────────────────────────────────────────── */

export const mediaStats = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "manage_media");
    const [library, attached] = await Promise.all([
      ctx.db.query("media_library").collect(),
      ctx.db.query("product_images").collect(),
    ]);
    return {
      libraryCount: library.length,
      productImageCount: attached.length,
      totalCount: library.length + attached.length,
    };
  },
});
