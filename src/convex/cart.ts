/**
 * Cart state.
 *
 * One row per active session. `sessionId` is the join key — anonymous
 * sessions pass a device token (e.g. `g:abc123`), signed-in sessions
 * use `u:<userId>`. On sign-in the FE calls `mergeFromLocal` so the
 * device cart's lines flow into the user cart via `mergeCartLines`.
 *
 * Hold/cart expiry is intentionally not enforced here — abandoned cart
 * recovery is a future follow-up; today rows simply persist.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId, getAuthUserId as _unused } from "@convex-dev/auth/server";
import { cartSessionId, mergeCartLines } from "./_helpers";

/* -------------------------------------------------------------- */
/* Queries                                                          */
/* -------------------------------------------------------------- */

/**
 * Resolve the cart for the current client. Pass the device session
 * token from localStorage so anonymous carts are reachable.
 */
export const getMine = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const userId = await getAuthUserId(ctx);
    const key = cartSessionId(userId ?? null, sessionId);
    const row = await ctx.db
      .query("carts")
      .withIndex("by_session", (q) => q.eq("sessionId", key))
      .unique();
    return row ?? null;
  },
});

/* -------------------------------------------------------------- */
/* Mutations                                                        */
/* -------------------------------------------------------------- */

/**
 * Add a line. Creates the cart row if it doesn't exist. Quantity
 * merges when (productId, size, color) already exists.
 */
export const addLine = mutation({
  args: {
    sessionId: v.string(),
    productId: v.string(),
    size: v.string(),
    color: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, { sessionId, productId, size, color, quantity }) => {
    const userId = await getAuthUserId(ctx);
    const key = cartSessionId(userId ?? null, sessionId);
    const row = await ctx.db
      .query("carts")
      .withIndex("by_session", (q) => q.eq("sessionId", key))
      .unique();
    const newLine = {
      productId,
      size,
      color,
      quantity,
      addedAt: Date.now(),
    };
    if (!row) {
      await ctx.db.insert("carts", {
        userId: userId ?? undefined,
        sessionId: key,
        lines: [newLine],
        updatedAt: Date.now(),
      });
      return;
    }
    const merged = mergeCartLines<typeof newLine>(row.lines, [newLine]);
    await ctx.db.patch(row._id, {
      lines: merged,
      updatedAt: Date.now(),
    });
  },
});

export const updateLine = mutation({
  args: {
    sessionId: v.string(),
    productId: v.string(),
    size: v.string(),
    color: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, { sessionId, productId, size, color, quantity }) => {
    const userId = await getAuthUserId(ctx);
    const key = cartSessionId(userId ?? null, sessionId);
    const row = await ctx.db
      .query("carts")
      .withIndex("by_session", (q) => q.eq("sessionId", key))
      .unique();
    if (!row) return;
    const next = row.lines
      .map((l) =>
        l.productId === productId && l.size === size && l.color === color
          ? { ...l, quantity }
          : l
      )
      .filter((l) => l.quantity > 0);
    await ctx.db.patch(row._id, { lines: next, updatedAt: Date.now() });
  },
});

export const removeLine = mutation({
  args: {
    sessionId: v.string(),
    productId: v.string(),
    size: v.string(),
    color: v.string(),
  },
  handler: async (ctx, { sessionId, productId, size, color }) => {
    const userId = await getAuthUserId(ctx);
    const key = cartSessionId(userId ?? null, sessionId);
    const row = await ctx.db
      .query("carts")
      .withIndex("by_session", (q) => q.eq("sessionId", key))
      .unique();
    if (!row) return;
    const next = row.lines.filter(
      (l) => !(l.productId === productId && l.size === size && l.color === color)
    );
    await ctx.db.patch(row._id, { lines: next, updatedAt: Date.now() });
  },
});

export const clear = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const userId = await getAuthUserId(ctx);
    const key = cartSessionId(userId ?? null, sessionId);
    const row = await ctx.db
      .query("carts")
      .withIndex("by_session", (q) => q.eq("sessionId", key))
      .unique();
    if (!row) return;
    await ctx.db.patch(row._id, { lines: [], updatedAt: Date.now() });
  },
});

/**
 * One-shot merge called by the client immediately after sign-in to
 * pull anonymous device-cart lines into the signed-in cart.
 */
export const mergeFromLocal = mutation({
  args: {
    deviceSessionId: v.string(),
    localLines: v.array(
      v.object({
        productId: v.string(),
        size: v.string(),
        color: v.string(),
        quantity: v.number(),
      })
    ),
  },
  handler: async (ctx, { deviceSessionId, localLines }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("UNAUTHORIZED: sign-in required to merge carts");
    }
    const userKey = cartSessionId(userId, "device");
    const guestKey = cartSessionId(null, deviceSessionId);

    const userCart = await ctx.db
      .query("carts")
      .withIndex("by_session", (q) => q.eq("sessionId", userKey))
      .unique();
    const guestCart = await ctx.db
      .query("carts")
      .withIndex("by_session", (q) => q.eq("sessionId", guestKey))
      .unique();

    const guestLines = (guestCart?.lines ?? []).concat(
      localLines.map((l) => ({ ...l, addedAt: Date.now() }))
    );

    if (userCart) {
      await ctx.db.patch(userCart._id, {
        lines: mergeCartLines(userCart.lines, guestLines),
        updatedAt: Date.now(),
        userId,
      });
    } else {
      await ctx.db.insert("carts", {
        userId,
        sessionId: userKey,
        lines: guestLines,
        updatedAt: Date.now(),
      });
    }

    if (guestCart) {
      await ctx.db.delete(guestCart._id);
    }
  },
});

/** Edit optional cart fields — coupon, gift note, shipping estimate. */
export const setMeta = mutation({
  args: {
    sessionId: v.string(),
    couponCode: v.optional(v.string()),
    giftNote: v.optional(v.string()),
    shippingCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const key = cartSessionId(userId ?? null, args.sessionId);
    const row = await ctx.db
      .query("carts")
      .withIndex("by_session", (q) => q.eq("sessionId", key))
      .unique();
    if (!row) return;
    await ctx.db.patch(row._id, {
      couponCode: args.couponCode,
      giftNote: args.giftNote,
      shippingCents: args.shippingCents,
      updatedAt: Date.now(),
    });
  },
});
