/**
 * Phase 8.1 — marketplace export readiness.
 *
 * One normalized product feed that future marketplace integrations
 * (Torob / ترب, Digikala, Google Merchant) consume. Each row carries
 * the fields those feeds require: sku, barcode, brand, category,
 * price, availability, images, description.
 *
 * No integration is connected yet — the query is the contract.
 */
import { v } from "convex/values";
import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { requirePermission } from "./admin";

export const productFeed = query({
  args: {
    limit: v.optional(v.number()),
    includeDrafts: v.optional(v.boolean()),
  },
  handler: async (ctx: QueryCtx, { limit, includeDrafts }) => {
    await requirePermission(ctx, "manage_products");
    const products = await ctx.db.query("products").collect();
    const filtered = includeDrafts
      ? products
      : products.filter((p) => p.status === "published" && p.visible);

    const variants = await ctx.db.query("variants").collect();
    const byProduct = new Map<string, typeof variants>();
    for (const variant of variants) {
      const key = variant.productId;
      const list = byProduct.get(key) ?? [];
      list.push(variant);
      byProduct.set(key, list);
    }

    const rows = filtered.map((p) => {
      const pv = byProduct.get(p._id) ?? [];
      const availableStock = pv.reduce(
        (sum, v) => sum + Math.max(0, v.stock - (v.reserved ?? 0)),
        0
      );
      return {
        id: p.slug,
        title: p.name,
        description: p.seoDescription ?? p.description,
        brand: "Lona",
        category: p.category,
        priceCents: p.priceCents,
        currency: p.currency,
        images: p.imageUrls ?? [],
        availability: pv.length === 0 || availableStock > 0 ? "in_stock" : "out_of_stock",
        availableStock,
        variants: pv.map((v) => ({
          sku: v.sku,
          barcode: v.sku, // barcode readiness — sku doubles as GTIN until EANs are assigned
          size: v.size,
          color: v.color,
          stock: v.stock,
          reserved: v.reserved ?? 0,
          priceCents: v.priceCentsOverride ?? p.priceCents,
        })),
      };
    });

    rows.sort((a, b) => a.id.localeCompare(b.id));
    return limit ? rows.slice(0, limit) : rows;
  },
});
