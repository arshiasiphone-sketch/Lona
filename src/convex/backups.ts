import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requirePermission, audit } from "./admin";

export const listSnapshots = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "manage_settings");
    const rows = await ctx.db.query("backup_snapshots").collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows;
  },
});

export const createSnapshot = mutation({
  args: { label: v.optional(v.string()), payload: v.any() },
  handler: async (ctx, args) => {
    const user = await requirePermission(ctx, "manage_settings");
    const label = (args.label?.trim() || `نسخه ${new Date().toLocaleDateString("fa-IR")}`).slice(0, 80);
    // payload is the export blob assembled client-side from exportRows
    if (!args.payload || typeof args.payload !== "object") throw new Error("INVALID_PAYLOAD");
    const existing = await ctx.db.query("backup_snapshots").collect();
    const version = existing.length ? Math.max(...existing.map((s) => s.version)) + 1 : 1;
    const id = await ctx.db.insert("backup_snapshots", {
      label,
      version,
      createdAt: Date.now(),
      createdBy: user._id,
      payload: args.payload,
    });
    await audit(ctx, user, "backup.create", "backup_snapshots", id, { label, version });
    return id;
  },
});

export const deleteSnapshot = mutation({
  args: { id: v.id("backup_snapshots") },
  handler: async (ctx, { id }) => {
    const user = await requirePermission(ctx, "manage_settings");
    const row = await ctx.db.get(id);
    if (!row) throw new Error("NOT_FOUND");
    await ctx.db.delete(id);
    await audit(ctx, user, "backup.delete", "backup_snapshots", id);
  },
});
