/**
 * Editorials table — campaign / atelier / journal / blog entries.
 * Single source of truth (per thinker's Phase-4 decision); categories
 * are a `kind` column rather than separate tables.
 */
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./_helpers";
import { vEditorialKind, vGradient } from "./validators";

export const listPublished = query({
  args: {
    kind: v.optional(vEditorialKind),
  },
  handler: async (ctx, { kind }) => {
    const rows = await ctx.db
      .query("editorials")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
    return kind ? rows.filter((r) => r.kind === kind) : rows;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("editorials")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const search = query({
  args: {
    query: v.string(),
    kind: v.optional(vEditorialKind),
  },
  handler: async (ctx, { query: term, kind }) => {
    return await ctx.db
      .query("editorials")
      .withSearchIndex("search_title", (q) => {
        const base = q.search("title", term).eq("status", "published");
        return kind ? base.eq("kind", kind) : base;
      })
      .take(20);
  },
});

export const upsertBySlug = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    excerpt: v.string(),
    body: v.optional(v.string()),
    coverGradient: vGradient,
    coverImageId: v.optional(v.id("product_images")),
    kind: vEditorialKind,
    author: v.string(),
    publishedAt: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived")
    ),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("editorials")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("editorials", args);
  },
});
