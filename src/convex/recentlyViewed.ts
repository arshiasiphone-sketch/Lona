/**
 * Recently-viewed state.
 *
 * One row per active session. The mutation enforces a 20-item cap
 * server-side so a malicious client cannot push thousands of ids.
 *
 * `productId` is an opaque string (matches the FE catalog ids like
 * "p-001") — see the comment on `carts.lines.productId` in schema.ts.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { cartSessionId } from "./_helpers";

const CAP = 20;

export const getMine = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const userId = await getAuthUserId(ctx);
    const key = cartSessionId(userId, sessionId);
    const row = await ctx.db
      .query("recently_viewed")
      .withIndex("by_session", (q) => q.eq("sessionId", key))
      .unique();
    return row ?? null;
  },
});

export const track = mutation({
  args: {
    sessionId: v.string(),
    productId: v.string(),
  },
  handler: async (ctx, { sessionId, productId }) => {
    const userId = await getAuthUserId(ctx);
    const key = cartSessionId(userId, sessionId);
    const row = await ctx.db
      .query("recently_viewed")
      .withIndex("by_session", (q) => q.eq("sessionId", key))
      .unique();

    if (!row) {
      await ctx.db.insert("recently_viewed", {
        userId: userId ?? undefined,
        sessionId: key,
        productIds: [productId],
        updatedAt: Date.now(),
      });
      return;
    }
    const next = [productId, ...row.productIds.filter((id) => id !== productId)].slice(
      0,
      CAP
    );
    await ctx.db.patch(row._id, {
      productIds: next,
      userId: userId ?? row.userId,
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
      .query("recently_viewed")
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
    const userRow = await ctx.db
      .query("recently_viewed")
      .withIndex("by_session", (q) => q.eq("sessionId", userKey))
      .unique();
    const guestRow = await ctx.db
      .query("recently_viewed")
      .withIndex("by_session", (q) => q.eq("sessionId", guestKey))
      .unique();

    // Preserve latest-first ordering: local-first → guest → user.
    const merged = Array.from(
      new Set([
        ...localIds,
        ...(guestRow?.productIds ?? []),
        ...(userRow?.productIds ?? []),
      ])
    ).slice(0, CAP);

    if (userRow) {
      await ctx.db.patch(userRow._id, {
        productIds: merged,
        userId,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("recently_viewed", {
        userId,
        sessionId: userKey,
        productIds: merged,
        updatedAt: Date.now(),
      });
    }
    if (guestRow) await ctx.db.delete(guestRow._id);
  },
});
