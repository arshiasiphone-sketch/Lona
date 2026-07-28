/**
 * Wishlist state.
 *
 * One row per session, same sessionId semantics as `cart.ts`. A
 * simpler `string[]` shape — duplicates ignored, fast toggle.
 *
 * `productId` is an opaque string (matches the FE catalog ids like
 * "p-001") — see the comment on `carts.lines.productId` in schema.ts.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { cartSessionId } from "./_helpers";

export const getMine = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const userId = await getAuthUserId(ctx);
    const key = cartSessionId(userId, sessionId);
    const row = await ctx.db
      .query("wishlists")
      .withIndex("by_session", (q) => q.eq("sessionId", key))
      .unique();
    return row ?? null;
  },
});

export const toggle = mutation({
  args: {
    sessionId: v.string(),
    productId: v.string(),
  },
  handler: async (ctx, { sessionId, productId }) => {
    const userId = await getAuthUserId(ctx);
    const key = cartSessionId(userId, sessionId);
    const row = await ctx.db
      .query("wishlists")
      .withIndex("by_session", (q) => q.eq("sessionId", key))
      .unique();
    if (!row) {
      await ctx.db.insert("wishlists", {
        userId: userId ?? undefined,
        sessionId: key,
        productIds: [productId],
        updatedAt: Date.now(),
      });
      return { added: true };
    }
    const has = row.productIds.includes(productId);
    const next = has
      ? row.productIds.filter((id) => id !== productId)
      : [...row.productIds, productId];
    await ctx.db.patch(row._id, {
      productIds: next,
      updatedAt: Date.now(),
      userId: userId ?? row.userId,
    });
    return { added: !has };
  },
});

export const remove = mutation({
  args: {
    sessionId: v.string(),
    productId: v.string(),
  },
  handler: async (ctx, { sessionId, productId }) => {
    const userId = await getAuthUserId(ctx);
    const key = cartSessionId(userId, sessionId);
    const row = await ctx.db
      .query("wishlists")
      .withIndex("by_session", (q) => q.eq("sessionId", key))
      .unique();
    if (!row) return;
    await ctx.db.patch(row._id, {
      productIds: row.productIds.filter((id) => id !== productId),
      updatedAt: Date.now(),
    });
  },
});

export const clear = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const userId = await getAuthUserId(ctx);
    const key = cartSessionId(userId, sessionId);
    const row = await ctx.db
      .query("wishlists")
      .withIndex("by_session", (q) => q.eq("sessionId", key))
      .unique();
    if (!row) return;
    await ctx.db.patch(row._id, { productIds: [], updatedAt: Date.now() });
  },
});

export const mergeFromLocal = mutation({
  args: {
    deviceSessionId: v.string(),
    localIds: v.array(v.string()),
  },
  handler: async (ctx, { deviceSessionId, localIds }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHORIZED");
    const userKey = cartSessionId(userId, "device");
    const guestKey = cartSessionId(null, deviceSessionId);

    const userWish = await ctx.db
      .query("wishlists")
      .withIndex("by_session", (q) => q.eq("sessionId", userKey))
      .unique();
    const guestWish = await ctx.db
      .query("wishlists")
      .withIndex("by_session", (q) => q.eq("sessionId", guestKey))
      .unique();

    const merged = Array.from(
      new Set([
        ...(userWish?.productIds ?? []),
        ...(guestWish?.productIds ?? []),
        ...localIds,
      ])
    );

    if (userWish) {
      await ctx.db.patch(userWish._id, {
        productIds: merged,
        userId,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("wishlists", {
        userId,
        sessionId: userKey,
        productIds: merged,
        updatedAt: Date.now(),
      });
    }
    if (guestWish) await ctx.db.delete(guestWish._id);
  },
});
