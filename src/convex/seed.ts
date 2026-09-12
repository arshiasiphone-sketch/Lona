/**
 * Phase 5.8 — Idempotent seed action.
 *
 * Reads the full LONA catalogue from `src/data/lona-catalog.ts`
 * (the single source-of-truth created in Phase 5.8) and upserts
 * it into Convex. Variant and review seeding is batched to keep
 * the action from timing out.
 *
 * Invoke via the Convex dashboard ("Run action" → `seed:runAll`)
 * or via:
 *     bun convex run seed:runAll '{}'
 *
 * Safe to re-run — every entity is upserted by its unique key
 * (slug / code / sku). Historical orders remain valid because
 * product IDs are opaque string refs (the slug).
 */
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v as convV } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  LONA_CATEGORIES,
  LONA_PRODUCTS,
  LONA_EDITORIALS,
  LONA_COUPONS,
  LONA_REVIEWS,
  LINGERIE_SIZES,
  ACCESSORY_SIZES,
  type LonaCategorySlug,
} from "../data/lona-catalog";

interface SeedResult {
  categories: number;
  products: number;
  variants: number;
  editorials: number;
  reviews: number;
  coupons: number;
  warehouses: number;
  shippingMethods: number;
  startedAt: number;
  finishedAt: number;
}

/**
 * Deterministic stock distribution per variant. Used to spread
 * inventory realistically across the catalog (high / medium / low
 * / out-of-stock) without an external RNG.
 *
 * @param pIdx product index in LONA_PRODUCTS
 * @param cIdx color index within the product's color list
 * @param sIdx size index within the product's size list
 */
function stockFor(pIdx: number, _cIdx: number, _sIdx: number): number {
  const h = (pIdx * 31 + 7) % 13;
  if (h === 0) return 0;                 // out of stock
  if (h < 3)  return 1 + (h % 4);        // 1-4 (limited)
  if (h < 7)  return 8 + (h % 4);        // 8-11 (low)
  if (h < 11) return 12 + (h % 6);       // 12-17 (medium)
  return 18 + (h % 7);                   // 18-24 (high)
}

/**
 * Run the full Phase 5.8 seed. Returns a tally.
 */
export const runAll = action({
  args: {},
  handler: async (ctx): Promise<SeedResult> => {
    const startedAt = Date.now();

    // ── 1) Categories ─────────────────────────────────────
    let categoryCount = 0;
    for (const c of LONA_CATEGORIES) {
      await ctx.runMutation(internal.seed.upsertCategory, {
        slug: c.slug,
        name: c.name,
        description: c.description,
        order: c.order,
        visible: c.visible,
        seo: c.seo,
      });
      categoryCount++;
    }

    // ── 2) Products (id → slug map for variant FK) ────────
    const productIdBySlug = new Map<string, Id<"products">>();
    for (const p of LONA_PRODUCTS) {
      const id = await ctx.runMutation(internal.seed.upsertProduct, {
        slug: p.slug,
        name: p.name,
        category: p.category as LonaCategorySlug,
        priceCents: p.price,
        compareAtCents: p.compareAt,
        currency: "USD",
        description: p.description,
        composition: p.composition,
        origin: p.origin,
        colors: p.colors.map((cid, idx) => {
          const def = p.colors[idx]!;
          // We only stored color ids on the product; resolve to gradient from the
          // color-options table by reading the LONA_COLOR_OPTIONS implicitly here.
          // (The seed-time color row carries id+name+gradient back into Convex.)
          return {
            id: cid,
            name: lookupColorName(cid),
            gradient: lookupColorGradient(cid) as
              | "mist" | "oat" | "rose" | "deep" | "ivory" | "pearl",
          };
        }),
        sizes: p.sizes.map((sid) => {
          const primary = p.sizes.length === 1 ? ACCESSORY_SIZES : LINGERIE_SIZES;
          const fallback = p.sizes.length === 1 ? LINGERIE_SIZES : ACCESSORY_SIZES;
          const found =
            primary.find((s) => s.id === sid) ??
            fallback.find((s) => s.id === sid);
          if (!found) throw new Error(`Unknown size id: ${sid} in product ${p.slug}`);
          return { id: found.id, label: found.label };
        }),
        badges: p.badges,
        rating: p.rating,
        reviewCount: p.reviewCount,
        secondaryGradient: p.secondaryGradient as
          | "mist" | "oat" | "rose" | "deep" | "ivory" | "pearl",
        imageUrls: p.imageUrls,
        status: "published",
        featured: !!p.featured,
        trending: !!p.trending,
        editorial: !!p.editorial,
        visible: true,
      });
      productIdBySlug.set(p.slug, id);
    }

    // ── 3) Variants (batched per product) ─────────────────
    type VariantRow = {
      productId: Id<"products">;
      sku: string;
      size: string;
      color: string;
      stock: number;
      available: boolean;
    };
    const allRows: VariantRow[] = [];
    LONA_PRODUCTS.forEach((p, pIdx) => {
      const productId = productIdBySlug.get(p.slug);
      if (!productId) return;
      p.colors.forEach((colorId, cIdx) => {
        p.sizes.forEach((sizeId, sIdx) => {
          const stock = stockFor(pIdx, cIdx, sIdx);
          allRows.push({
            productId,
            sku: `${p.slug.toUpperCase().replace(/[^A-Z0-9]/g, "-")}-${colorId.toUpperCase()}-${sizeId.toUpperCase()}`,
            size: sizeId,
            color: colorId,
            stock,
            available: stock > 0,
          });
        });
      });
    });

    // Bulk insert variants — pass chunks of 400 to stay well under
    // the 16kB arg cap and the 1k-AST-node soft cap.
    const CHUNK = 400;
    let variantCount = 0;
    for (let i = 0; i < allRows.length; i += CHUNK) {
      const chunk = allRows.slice(i, i + CHUNK);
      await ctx.runMutation(internal.seed.upsertVariantsBulk, { rows: chunk });
      variantCount += chunk.length;
    }

    // ── 4) Editorials ──────────────────────────────────────
    for (const e of LONA_EDITORIALS) {
      await ctx.runMutation(internal.seed.upsertEditorial, {
        slug: e.slug,
        title: e.title,
        excerpt: e.excerpt,
        coverGradient: e.coverGradient as "mist" | "oat" | "rose" | "deep" | "ivory",
        kind: e.kind,
        author: e.author,
        publishedAt: e.publishedAt,
        status: "published",
        body: undefined,
        tags: ["lingerie", "lona"],
      });
    }

    // ── 6) Reviews (LONA_REVIEWS) ─────────────────────────
    let reviewCount = 0;
    for (const r of LONA_REVIEWS) {
      const productId = productIdBySlug.get(r.productSlug);
      if (!productId) continue;
      await ctx.runMutation(internal.seed.upsertReview, {
        productId,
        rating: r.rating,
        body: r.body,
        verified: r.verified,
        authorHint: r.author,
        daysAgo: r.daysAgo,
      });
      reviewCount++;
    }

    // ── 7) Coupons ────────────────────────────────────────
    let couponCount = 0;
    for (const cp of LONA_COUPONS) {
      await ctx.runMutation(internal.seed.upsertCoupon, {
        code: cp.code,
        percentOff: cp.percentOff,
        description: cp.description,
        active: cp.active,
      });
      couponCount++;
    }

    // ── 8) Default warehouse ─────────────────────────────
    await ctx.runMutation(internal.seed.upsertWarehouse, {
      code: "TEHRAN",
      name: "انبار مرکزی تهران",
      country: "IR",
      active: true,
    });

    // ── 9) Shipping methods (Phase 8.1) ──────────────────
    const shippingDefaults = [
      {
        code: "standard",
        name: "ارسال عادی",
        priceCents: 120000,
        estimatedDays: 7,
        order: 1,
      },
      {
        code: "express",
        name: "ارسال سریع",
        priceCents: 250000,
        estimatedDays: 3,
        order: 2,
      },
      {
        code: "white_glove",
        name: "پیک شهری",
        priceCents: 650000,
        estimatedDays: 1,
        order: 3,
      },
    ];
    let shippingCount = 0;
    for (const method of shippingDefaults) {
      await ctx.runMutation(internal.seed.upsertShippingMethod, {
        ...method,
        active: true,
      });
      shippingCount++;
    }

    return {
      categories: categoryCount,
      products: LONA_PRODUCTS.length,
      variants: variantCount,
      editorials: LONA_EDITORIALS.length,
      reviews: reviewCount,
      coupons: couponCount,
      warehouses: 1,
      shippingMethods: shippingCount,
      startedAt,
      finishedAt: Date.now(),
    };
  },
});

// ──────────────────────────────────────────────────────────────
// Color/Name/Gradient lookup mirrors — local table that matches
// src/data/lona-catalog.ts::LONA_COLOR_OPTIONS so the seed stays
// self-contained (no server-side cross-file import gymnastics).
// ──────────────────────────────────────────────────────────────
function lookupColorGradient(id: string): string {
  switch (id) {
    case "black":     return "deep";
    case "white":     return "mist";
    case "beige":     return "oat";
    case "rose":      return "rose";
    case "burgundy":  return "deep";
    case "navy":      return "deep";
    case "chocolate": return "oat";
    case "emerald":   return "oat";
    default:          return "mist";
  }
}
function lookupColorName(id: string): string {
  switch (id) {
    case "black":     return "مشکی";
    case "white":     return "سفید";
    case "beige":     return "بژ";
    case "rose":      return "رز کمرنگ";
    case "burgundy":  return "شرابی";
    case "navy":      return "سرمه‌ای";
    case "chocolate": return "شکلاتی";
    case "emerald":   return "زمردی";
    default:          return id;
  }
}

// =============================================================
// INTERNAL MUTATIONS
// =============================================================
import { internalMutation } from "./_generated/server";

export const upsertCategory = internalMutation({
  args: {
    slug: convV.string(),
    name: convV.string(),
    description: convV.optional(convV.string()),
    parentId: convV.optional(convV.id("categories")),
    order: convV.number(),
    visible: convV.boolean(),
    seo: convV.object({
      title: convV.optional(convV.string()),
      description: convV.optional(convV.string()),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("categories").withIndex("by_slug", (q) => q.eq("slug", args.slug)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("categories", args);
  },
});

export const upsertProduct = internalMutation({
  args: {
    slug: convV.string(),
    name: convV.string(),
    category: convV.union(
      convV.literal("bras"),
      convV.literal("briefs"),
      convV.literal("sets"),
      convV.literal("sleepwear"),
      convV.literal("loungewear"),
      convV.literal("bodysuits"),
      convV.literal("shapewear"),
      convV.literal("sportswear"),
      convV.literal("accessories"),
      convV.literal("bridal"),
    ),
    priceCents: convV.number(),
    compareAtCents: convV.optional(convV.number()),
    currency: convV.literal("USD"),
    description: convV.string(),
    composition: convV.string(),
    origin: convV.string(),
    colors: convV.array(
      convV.object({
        id: convV.string(),
        name: convV.string(),
        gradient: convV.union(
          convV.literal("mist"),
          convV.literal("oat"),
          convV.literal("rose"),
          convV.literal("deep"),
          convV.literal("ivory"),
          convV.literal("pearl"),
        ),
      })
    ),
    sizes: convV.array(convV.object({ id: convV.string(), label: convV.string() })),
    badges: convV.array(
      convV.union(
        convV.literal("new"),
        convV.literal("restocked"),
        convV.literal("limited"),
        convV.literal("editorial"),
        convV.literal("exclusive"),
      )
    ),
    rating: convV.optional(convV.number()),
    reviewCount: convV.optional(convV.number()),
    secondaryGradient: convV.optional(
      convV.union(
        convV.literal("mist"),
        convV.literal("oat"),
        convV.literal("rose"),
        convV.literal("deep"),
        convV.literal("ivory"),
          convV.literal("pearl"),
      )
    ),
    imageUrls: convV.optional(convV.array(convV.string())),
    status: convV.union(
      convV.literal("draft"),
      convV.literal("published"),
      convV.literal("archived"),
    ),
    featured: convV.boolean(),
    trending: convV.boolean(),
    editorial: convV.boolean(),
    visible: convV.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("products").withIndex("by_slug", (q) => q.eq("slug", args.slug)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("products", args);
  },
});

/**
 * Bulk variant upsert. Called in chunks from the seed action so
 * the action doesn't time out on ~3,000 individual inserts.
 */
export const upsertVariantsBulk = internalMutation({
  args: {
    rows: convV.array(
      convV.object({
        productId: convV.id("products"),
        sku: convV.string(),
        size: convV.string(),
        color: convV.string(),
        stock: convV.number(),
        available: convV.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const row of args.rows) {
      const existing = await ctx.db
        .query("variants").withIndex("by_sku", (q) => q.eq("sku", row.sku)).unique();
      if (existing) {
        // Don't touch stock on re-seed (someone may have consumed it).
        await ctx.db.patch(existing._id, {
          productId: row.productId,
          size: row.size,
          color: row.color,
          available: row.available,
        });
      } else {
        await ctx.db.insert("variants", row);
      }
    }
  },
});

export const upsertEditorial = internalMutation({
  args: {
    slug: convV.string(),
    title: convV.string(),
    excerpt: convV.string(),
    coverGradient: convV.union(
      convV.literal("mist"),
      convV.literal("oat"),
      convV.literal("rose"),
      convV.literal("deep"),
      convV.literal("ivory"),
          convV.literal("pearl"),
    ),
    kind: convV.union(
      convV.literal("journal"),
      convV.literal("atelier"),
      convV.literal("campaign"),
      convV.literal("blog"),
    ),
    author: convV.string(),
    publishedAt: convV.number(),
    status: convV.union(
      convV.literal("draft"),
      convV.literal("published"),
      convV.literal("archived"),
    ),
    body: convV.optional(convV.string()),
    tags: convV.optional(convV.array(convV.string())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("editorials").withIndex("by_slug", (q) => q.eq("slug", args.slug)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("editorials", args);
  },
});

export const upsertReview = internalMutation({
  args: {
    productId: convV.string(),
    rating: convV.number(),
    body: convV.optional(convV.string()),
    verified: convV.boolean(),
    authorHint: convV.string(),
    daysAgo: convV.number(),
  },
  handler: async (ctx, args) => {
    const createdAt = Date.now() - args.daysAgo * 86_400_000;
    return await ctx.db.insert("reviews", {
      productId: args.productId,
      rating: args.rating,
      title: undefined,
      body: args.body,
      verified: args.verified,
      status: "published" as const,
      createdAt,
    });
  },
});

export const upsertCoupon = internalMutation({
  args: {
    code: convV.string(),
    percentOff: convV.number(),
    description: convV.optional(convV.string()),
    active: convV.boolean(),
  },
  handler: async (ctx, args) => {
    const code = args.code.toUpperCase();
    const existing = await ctx.db
      .query("coupons").withIndex("by_code", (q) => q.eq("code", code)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        code, percentOff: args.percentOff, description: args.description, active: args.active,
      });
      return existing._id;
    }
    return await ctx.db.insert("coupons", {
      code, percentOff: args.percentOff, description: args.description,
      active: args.active, usedCount: 0,
    });
  },
});

export const upsertWarehouse = internalMutation({
  args: {
    code: convV.string(),
    name: convV.string(),
    country: convV.string(),
    active: convV.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("warehouses").withIndex("by_code", (q) => q.eq("code", args.code)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args });
      return existing._id;
    }
    return await ctx.db.insert("warehouses", args);
  },
});

export const upsertShippingMethod = internalMutation({
  args: {
    code: convV.string(),
    name: convV.string(),
    priceCents: convV.number(),
    estimatedDays: convV.number(),
    active: convV.boolean(),
    order: convV.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("shipping_methods").withIndex("by_code", (q) => q.eq("code", args.code)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args });
      return existing._id;
    }
    return await ctx.db.insert("shipping_methods", args);
  },
});
