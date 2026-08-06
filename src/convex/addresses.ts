/**
 * Customer addresses — scoped per user.
 */
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./_helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    id: v.optional(v.id("addresses")),
    label: v.string(),
    fullName: v.string(),
    line1: v.string(),
    line2: v.optional(v.string()),
    city: v.string(),
    region: v.string(),
    postalCode: v.string(),
    country: v.string(),
    phone: v.optional(v.string()),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = args.id ? await ctx.db.get(args.id) : null;

    if (args.id && (!existing || existing.userId !== user._id)) {
      throw new Error("FORBIDDEN");
    }

    if (args.isDefault) {
      // Unset previous default before inserting the new one.
      const prior = await ctx.db
        .query("addresses")
        .withIndex("by_default_user", (q) =>
          q.eq("userId", user._id).eq("isDefault", true)
        )
        .collect();
      for (const row of prior) {
        await ctx.db.patch(row._id, { isDefault: false });
      }
    }

    if (args.id) {
      await ctx.db.patch(args.id, {
        label: args.label,
        fullName: args.fullName,
        line1: args.line1,
        line2: args.line2,
        city: args.city,
        region: args.region,
        postalCode: args.postalCode,
        country: args.country,
        phone: args.phone,
        isDefault: args.isDefault,
      });
      if (args.isDefault) {
        await ctx.db.patch(user._id, { defaultAddressId: args.id });
      } else if (user.defaultAddressId === args.id) {
        await ctx.db.patch(user._id, { defaultAddressId: undefined });
      }
      return args.id;
    }
    const newId = await ctx.db.insert("addresses", {
      userId: user._id,
      label: args.label,
      fullName: args.fullName,
      line1: args.line1,
      line2: args.line2,
      city: args.city,
      region: args.region,
      postalCode: args.postalCode,
      country: args.country,
      phone: args.phone,
      isDefault: args.isDefault,
    });
    if (args.isDefault) {
      await ctx.db.patch(user._id, { defaultAddressId: newId });
    }
    return newId;
  },
});

export const remove = mutation({
  args: { id: v.id("addresses") },
  handler: async (ctx, { id }) => {
    const user = await requireUser(ctx);
    const row = await ctx.db.get(id);
    if (!row || row.userId !== user._id) {
      throw new Error("FORBIDDEN");
    }
    await ctx.db.delete(id);
    if (user.defaultAddressId === id) {
      await ctx.db.patch(user._id, { defaultAddressId: undefined });
    }
  },
});
