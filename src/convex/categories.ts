/**
 * Categories table — flat hierarchy via optional parentId.
 * Mostly read-side; mutations are admin-only.
 */
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireAdmin } from "./_helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

export const visible = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("categories").collect();
    return all.filter((c) => c.visible).sort((a, b) => a.order - b.order);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const upsertBySlug = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    order: v.number(),
    visible: v.boolean(),
    seo: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("categories", args);
  },
});
