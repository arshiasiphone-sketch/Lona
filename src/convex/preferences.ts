/**
 * User preferences — locale, sizes, notification toggles.
 * Stored 1:1 against the user; default row auto-created on first read.
 */
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./_helpers";

const DEFAULTS = {
  locale: "en-US",
  currency: "USD" as const,
  sizes: { top: undefined, bottom: undefined, shoe: undefined },
  notifications: {
    orderUpdates: true,
    editorialDigest: false,
    backInStock: true,
    marketing: false,
  },
  marketingOptIn: false,
};

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const row = await ctx.db
      .query("preferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    return row ?? { ...DEFAULTS, userId: user._id, updatedAt: 0 };
  },
});

/** Upsert called from the Dashboard "Preferences" tab + profile UI. */
export const upsert = mutation({
  args: {
    locale: v.string(),
    sizes: v.object({
      top: v.optional(v.string()),
      bottom: v.optional(v.string()),
      shoe: v.optional(v.string()),
    }),
    notifications: v.object({
      orderUpdates: v.boolean(),
      editorialDigest: v.boolean(),
      backInStock: v.boolean(),
      marketing: v.boolean(),
    }),
    marketingOptIn: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("preferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    const payload = {
      userId: user._id,
      currency: "USD" as const,
      locale: args.locale,
      sizes: args.sizes,
      notifications: args.notifications,
      marketingOptIn: args.marketingOptIn,
      updatedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("preferences", payload);
  },
});
