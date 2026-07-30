/**
 * Phase 5.2 — Admin settings + homepage content blocks.
 *
 * Stores the entire homepage composition as a single JSON array
 * row in the existing `settings` table. Each block is keyed:
 *
 *   { id, type, title, enabled, payload }
 *
 * `type` discriminates which storefront component renders it
 * (`hero`, `featured_collections`, `trending_products`,
 * `brand_manifesto`, `testimonials`, `lookbook`, `journal`,
 * `instagram`, `newsletter`). The FE renders based on the
 * discriminator so the backend doesn't need to evolve.
 *
 * We chose the JSON-in-settings approach over a dedicated
 * `homepage_blocks` table because:
 *   1. The storefront doesn't read blocks per-row — it reads
 *      the array once on load.
 *   2. New block kinds ship without a schema migration.
 *   3. Reorder is just a `value` patch.
 *
 * Other settings (site name, default currency, social handles)
 * use the same table under different keys. The FE calls
 * `getAll()` to hydrate one seed object.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requirePermission, audit } from "./admin";

/* ────────────────────────────────────────────────────────────
 * Block shapes — kept loose with `payload` as a free-form
 * object so we can introduce new fields without redeploying
 * the backend. The FE renders per-type.
 * ──────────────────────────────────────────────────────────── */

const vHomepageBlock = v.object({
  id: v.string(),
  type: v.string(),
  title: v.string(),
  enabled: v.boolean(),
  payload: v.any(),
});

/* ────────────────────────────────────────────────────────────
 * READ
 * ──────────────────────────────────────────────────────────── */

/** Every settings row, including homepage blocks + global knobs. */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "manage_settings");
    return await ctx.db.query("settings").collect();
  },
});

/** Typed homepage blocks, hydrated. */
export const getHomepageBlocks = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "manage_settings");
    const row = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "homepage_blocks"))
      .unique();
    const value = (row?.value ?? []) as Array<{
      id: string;
      type: string;
      title: string;
      enabled: boolean;
      payload: unknown;
    }>;
    return value;
  },
});

/* ────────────────────────────────────────────────────────────
 * WRITE
 * ──────────────────────────────────────────────────────────── */

/**
 * Replace the whole homepage composition. Validation is light:
 *  • ids must be unique
 *  • each row needs a non-empty type
 * The FE owns the schema; the admin just commits what the
 * editor produced.
 */
export const setHomepageBlocks = mutation({
  args: {
    blocks: v.array(vHomepageBlock),
  },
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

/**
 * Toggle a single block's enabled flag without touching the rest
 * of the composition. Saves a full commit roundtrip when the
 * admin only wants to hide / reveal a section.
 */
export const toggleHomepageBlock = mutation({
  args: { id: v.string(), enabled: v.boolean() },
  handler: async (ctx, { id, enabled }) => {
    const user = await requirePermission(ctx, "manage_content");
    const row = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "homepage_blocks"))
      .unique();
    if (!row) return 0;
    const blocks = (row.value ?? []) as Array<{
      id: string;
      enabled: boolean;
    }>;
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

/**
 * Reorder blocks in one atomic write. The caller (drag-drop UI)
 * supplies the new ordered list of ids.
 */
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
    const next = order.flatMap((id, i) => {
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

/**
 * Upsert a generic settings row. Used for site-name, currency,
 * social links, etc. The key/value shape is open; the FE hydrates
 * whatever keys it expects.
 */
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
