/**
 * Phase 5.2 — Admin settings + homepage content blocks.
 *
 * Stores the entire homepage composition as a single JSON array
 * row in the existing `settings` table. Each block is keyed:
 *
 *   { id, type, title, enabled, payload }
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requirePermission, audit } from "./admin";

const vHomepageBlock = v.object({
  id: v.string(),
  type: v.string(),
  title: v.string(),
  enabled: v.boolean(),
  payload: v.any(),
});

const HOMEPAGE_IMAGE_KEYS = [
  "logo",
  "favicon",
  "og_image",
  "hero",
  "category_1",
  "category_2",
  "category_3",
  "category_4",
  "category_5",
  "category_6",
  "category_7",
  "category_8",
  "category_9",
  "category_10",
  "lookbook_1",
  "lookbook_2",
  "lookbook_3",
  "instagram_1",
  "instagram_2",
  "instagram_3",
  "instagram_4",
  "instagram_5",
  "instagram_6",
  "featured_collection_1",
  "featured_collection_2",
  "featured_collection_3",
  "about_workshop",
  "collections_1",
  "collections_2",
  "collections_3",
  "collections_4",
  "collection_hero",
  "press_hero",
  "press_1",
  "press_2",
  "press_3",
  "press_4",
] as const;

type HomepageImageKey = (typeof HOMEPAGE_IMAGE_KEYS)[number];

const isHomepageImageKey = (key: string): key is HomepageImageKey =>
  (HOMEPAGE_IMAGE_KEYS as readonly string[]).includes(key);

const isImageUrl = (url: string) =>
  /^https:\/\//i.test(url) ||
  /^http:\/\//i.test(url) ||
  /^data:image\//i.test(url);

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "manage_settings");
    return await ctx.db.query("settings").collect();
  },
});

export const getPublicHomepageImages = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "homepage_images"))
      .unique();
    return row?.value ?? {};
  },
});

/**
 * Phase 8.2 — public store information (legal/contact). Read by the
 * footer, invoice, contact page and the trust JSON-LD schemas. Stored
 * by the admin under the `store` settings key.
 */
export const getStoreInfo = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "store"))
      .unique();
    const value =
      row?.value && typeof row.value === "object"
        ? (row.value as Record<string, unknown>)
        : {};
    return {
      shopName: (value.shopName as string) ?? "لونا",
      phone: (value.phone as string) ?? "",
      email: (value.email as string) ?? "",
      address: (value.address as string) ?? "",
      postalCode: (value.postalCode as string) ?? "",
      nationalId: (value.nationalId as string) ?? "",
      hours: (value.hours as string) ?? "",
      social: (value.social as Record<string, string>) ?? {},
      enamadCode: (value.enamadCode as string) ?? "",
    };
  },
});

export const setHomepageImage = mutation({
  args: {
    key: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, { key, url }) => {
    const user = await requirePermission(ctx, "manage_settings");
    if (!isHomepageImageKey(key)) {
      throw new Error("HOMEPAGE_IMAGE_KEY_INVALID");
    }
    if (url !== undefined && url.trim() !== "" && !isImageUrl(url.trim())) {
      throw new Error("HOMEPAGE_IMAGE_URL_INVALID");
    }

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "homepage_images"))
      .unique();
    const current =
      existing?.value && typeof existing.value === "object"
        ? (existing.value as Record<string, unknown>)
        : {};
    const next = { ...current };
    const normalizedUrl = url?.trim() ?? "";
    if (normalizedUrl) next[key] = normalizedUrl;
    else delete next[key];

    if (Object.keys(next).length === 0) {
      if (existing) await ctx.db.delete(existing._id);
    } else if (existing) {
      await ctx.db.patch(existing._id, {
        value: next,
        updatedAt: Date.now(),
        updatedBy: user._id,
      });
    } else {
      await ctx.db.insert("settings", {
        key: "homepage_images",
        value: next,
        updatedAt: Date.now(),
        updatedBy: user._id,
      });
    }

    await audit(ctx, user, "homepage.image.update", "settings", existing?._id, {
      key,
      reset: !normalizedUrl,
    });
    return next;
  },
});

export const getHomepageBlocks = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "manage_settings");
    const row = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "homepage_blocks"))
      .unique();
    return (row?.value ?? []) as Array<{
      id: string;
      type: string;
      title: string;
      enabled: boolean;
      payload: unknown;
    }>;
  },
});

export const setHomepageBlocks = mutation({
  args: { blocks: v.array(vHomepageBlock) },
  handler: async (ctx, { blocks }) => {
    const user = await requirePermission(ctx, "manage_content");
    const ids = new Set<string>();
    for (const block of blocks) {
      if (!block.type) throw new Error("BLOCK_TYPE_MISSING");
      if (ids.has(block.id)) throw new Error(`DUP_BLOCK_ID:${block.id}`);
      ids.add(block.id);
    }

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "homepage_blocks"))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: blocks,
        updatedAt: Date.now(),
        updatedBy: user._id,
      });
    } else {
      await ctx.db.insert("settings", {
        key: "homepage_blocks",
        value: blocks,
        updatedAt: Date.now(),
        updatedBy: user._id,
      });
    }
    await audit(ctx, user, "homepage.update", "settings", existing?._id, {
      count: blocks.length,
    });
    return blocks.length;
  },
});

export const toggleHomepageBlock = mutation({
  args: { id: v.string(), enabled: v.boolean() },
  handler: async (ctx, { id, enabled }) => {
    const user = await requirePermission(ctx, "manage_content");
    const row = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "homepage_blocks"))
      .unique();
    if (!row) return 0;
    const blocks = (row.value ?? []) as Array<{ id: string; enabled: boolean }>;
    const next = blocks.map((b) => (b.id === id ? { ...b, enabled } : b));
    await ctx.db.patch(row._id, {
      value: next,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });
    await audit(ctx, user, "homepage.toggle", "settings", row._id, {
      id,
      enabled,
    });
    return next.length;
  },
});

export const reorderHomepageBlocks = mutation({
  args: { order: v.array(v.string()) },
  handler: async (ctx, { order }) => {
    const user = await requirePermission(ctx, "manage_content");
    const row = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "homepage_blocks"))
      .unique();
    if (!row) return 0;
    const existing = (row.value ?? []) as Array<{ id: string }>;
    const map = new Map(existing.map((b) => [b.id, b]));
    const next = order.flatMap((id) => {
      const found = map.get(id);
      return found ? [{ ...found }] : [];
    });
    await ctx.db.patch(row._id, {
      value: next,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });
    await audit(ctx, user, "homepage.reorder", "settings", row._id, {
      count: next.length,
    });
    return next.length;
  },
});

export const upsertSetting = mutation({
  args: {
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, { key, value }) => {
    const user = await requirePermission(ctx, "manage_settings");
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        value,
        updatedAt: Date.now(),
        updatedBy: user._id,
      });
      await audit(ctx, user, "setting.update", "settings", existing._id, {
        key,
      });
      return existing._id;
    }
    const id = await ctx.db.insert("settings", {
      key,
      value,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });
    await audit(ctx, user, "setting.create", "settings", id, { key });
    return id;
  },
});
