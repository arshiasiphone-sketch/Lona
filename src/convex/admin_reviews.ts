/**
 * Phase 5.3 — Review moderation.
 *
 * Three mutations cover the lifecycle of a customer review on the
 * admin queue:
 *   - `approveReview` — `pending → published` (visible on storefront).
 *   - `hideReview`    — any → `rejected` (hidden from storefront, kept
 *                       in DB for moderation audit).
 *   - `deleteReview`  — hard delete; the row, its history, and any
 *                       per-product rating rollups are wiped.
 *
 * Permission gating runs through `requirePermission("manage_content")`
 * since editorial + reviews both live on the same RBAC key.
 */
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requirePermission, audit } from "./admin";

export const approveReview = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, { id }) => {
    const user = await requirePermission(ctx, "manage_content");
    const review = await ctx.db.get(id);
    if (!review) throw new Error("REVIEW_NOT_FOUND");
    if (review.status === "published") return id;
    await ctx.db.patch(id, { status: "published" });
    await audit(ctx, user, "review.approve", "reviews", id);
    return id;
  },
});

export const hideReview = mutation({
  args: { id: v.id("reviews"), reason: v.optional(v.string()) },
  handler: async (ctx, { id, reason }) => {
    const user = await requirePermission(ctx, "manage_content");
    const review = await ctx.db.get(id);
    if (!review) throw new Error("REVIEW_NOT_FOUND");
    if (review.status === "rejected") return id;
    await ctx.db.patch(id, { status: "rejected" });
    await audit(ctx, user, "review.hide", "reviews", id, { reason });
    return id;
  },
});

export const deleteReview = mutation({
  args: { id: v.id("reviews") },
  handler: async (ctx, { id }) => {
    const user = await requirePermission(ctx, "manage_content");
    const review = await ctx.db.get(id);
    if (!review) return { deleted: false as const };
    await ctx.db.delete(id);
    await audit(ctx, user, "review.delete", "reviews", id, {
      productId: review.productId,
      rating: review.rating,
    });
    return { deleted: true as const };
  },
});
