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
      const images = p.imageUrls ?? [];

      // Phase 8.3 — feed-completeness warnings. Torob, Digikala and
      // Google Merchant reject or downrank rows with empty mandatory
      // fields, so surface them here instead of silently exporting
      // incomplete products.
      const warnings: string[] = [];
      if (!p.barcode) warnings.push("barcode_missing");
      if (!p.material) warnings.push("material_missing");
      if (images.length === 0) warnings.push("images_missing");
      if (pv.length === 0) warnings.push("variants_missing");
      else if (pv.some((v) => !v.sku)) warnings.push("sku_missing");
      if (!(p.seoDescription ?? p.description)) warnings.push("description_missing");

      return {
        id: p.slug,
        slug: p.slug,
        title: p.name,
        description: p.seoDescription ?? p.description,
        brand: p.brand ?? "Lona",
        barcode: p.barcode ?? null,
        material: p.material ?? null,
        category: p.category,
        priceCents: p.priceCents,
        currency: p.currency,
        images,
        availability: pv.length === 0 || availableStock > 0 ? "in_stock" : "out_of_stock",
        availableStock,
        sku: pv[0]?.sku ?? null,
        warnings,
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
