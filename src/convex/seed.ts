/**
 * Idempotent seed action.
 *
 * Mirrors the front-end mock catalog (`src/data/catalog.ts`) into Convex
 * so that:
 *   1. admins see real rows in the dashboard
 *   2. the FE can migrate to live queries without losing data
 *   3. reviews / orders can be tied to real `_id`s
 *
 * Safe to re-run — every entity is upserted by its unique key (slug
 * for products / collections / editorials, code for coupons, sku for
 * variants). Stock variants are recreated only if missing.
 *
 * Invoke from the Convex dashboard ("Run action" → `seed:runAll`) or
 * via:
 *     bun convex run seed:runAll '{"triggeredBy":"manual"}'
 */
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

interface SeedResult {
  products: number;
  collections: number;
  editorials: number;
  coupons: number;
  variants: number;
  categories: number;
  warehouses: number;
  startedAt: number;
  finishedAt: number;
}

/**
 * Run the full seed. Returns a tally.
 *
 * `replaceMode` is intentionally omitted as a parameter — we strictly
 * upsert, never delete, so historical orders still resolve.
 */
export const runAll = action({
  args: {},
  handler: async (ctx): Promise<SeedResult> => {
    const startedAt = Date.now();

    // ------------------------------------------------------------
    // 1) Categories
    // ------------------------------------------------------------
    const CATEGORIES = [
      {
        slug: "outerwear",
        name: "Outerwear",
        description: "Coats, blazers, toppers in considered cloth.",
        order: 1,
        visible: true,
        seo: { title: "Outerwear — ÆON", description: "Long coats and tailored toppers." },
      },
      {
        slug: "knitwear",
        name: "Knitwear",
        description: "Cashmere, silk-blends and tightly knit jersey.",
        order: 2,
        visible: true,
        seo: { title: "Knitwear — ÆON", description: "Quiet-knit layers." },
      },
      {
        slug: "shirting",
        name: "Shirting",
        description: "Egyptian cotton poplin, gauze, oxford.",
        order: 3,
        visible: true,
        seo: { title: "Shirts — ÆON", description: "Fine shirting cloth." },
      },
      {
        slug: "trousers",
        name: "Trousers",
        description: "Pleated, wide-leg and classic trouser shapes.",
        order: 4,
        visible: true,
        seo: { title: "Trousers — ÆON", description: "Tailored trousers." },
      },
      {
        slug: "dresses",
        name: "Dresses",
        description: "Evening columns, slip dresses and knit dresses.",
        order: 5,
        visible: true,
        seo: { title: "Dresses — ÆON", description: "Considered dress forms." },
      },
      {
        slug: "leather",
        name: "Leather",
        description: "Vegetable-tanned leather goods and footwear.",
        order: 6,
        visible: true,
        seo: { title: "Leather — ÆON", description: "Saddle-stitched leather." },
      },
      {
        slug: "accessories",
        name: "Accessories",
        description: "Eyewear, scarves, fragrance.",
        order: 7,
        visible: true,
        seo: { title: "Accessories — ÆON", description: "Companions for daily use." },
      },
    ];

    let categoryCount = 0;
    for (const c of CATEGORIES) {
      await ctx.runMutation(internal.seed.upsertCategory, c);
      categoryCount++;
    }

    // ------------------------------------------------------------
    // 2) Products
    // ------------------------------------------------------------
    const PRODUCTS = PRODUCTS_DATA;

    // Map slug → _id (returned per upsert) for later cross-references.
    const productIdBySlug = new Map<string, import("./_generated/dataModel").Id<"products">>();
    for (const p of PRODUCTS) {
      const id = await ctx.runMutation(internal.seed.upsertProduct, {
        ...p,
        badges: [...p.badges],
      });
      productIdBySlug.set(
        p.slug,
        id as import("./_generated/dataModel").Id<"products">
      );
    }

    // ------------------------------------------------------------
    // 3) Variants — derived from each product's colors × sizes.
    // ------------------------------------------------------------
    const variantSkuRows: {
      productId: import("./_generated/dataModel").Id<"products">;
      sku: string;
      size: string;
      color: string;
      stock: number;
      available: boolean;
    }[] = [];

    for (const p of PRODUCTS) {
      const productId = productIdBySlug.get(p.slug);
      if (!productId) continue;
      for (const color of p.colors) {
        for (const size of p.sizes) {
          variantSkuRows.push({
            productId,
            sku: `${p.slug.toUpperCase()}-${color.id.toUpperCase()}-${size.id.toUpperCase()}`,
            size: size.id,
            color: color.id,
            stock: 24, // luxury reality: small-batch replenishment
            available: true,
          });
        }
      }
    }
    for (const v of variantSkuRows) {
      await ctx.runMutation(internal.seed.upsertVariant, v);
    }

    // ------------------------------------------------------------
    // 4) Collections
    // ------------------------------------------------------------
    const COLLECTIONS = COLLECTIONS_DATA;
    for (const c of COLLECTIONS) {
      await ctx.runMutation(internal.seed.upsertCollection, c);
    }

    // ------------------------------------------------------------
    // 5) Editorials
    // ------------------------------------------------------------
    for (const e of EDITORIALS_DATA) {
      await ctx.runMutation(internal.seed.upsertEditorial, e);
    }

    // ------------------------------------------------------------
    // 6) Coupons
    // ------------------------------------------------------------
    let couponCount = 0;
    for (const cp of COUPONS_DATA) {
      await ctx.runMutation(internal.seed.upsertCoupon, cp);
      couponCount++;
    }

    // ------------------------------------------------------------
    // 7) Default warehouse
    // ------------------------------------------------------------
    await ctx.runMutation(internal.seed.upsertWarehouse, {
      code: "FLORENCE",
      name: "Florence Atelier",
      country: "IT",
      active: true,
    });

    return {
      products: PRODUCTS.length,
      collections: COLLECTIONS.length,
      editorials: EDITORIALS_DATA.length,
      coupons: couponCount,
      variants: variantSkuRows.length,
      categories: categoryCount,
      warehouses: 1,
      startedAt,
      finishedAt: Date.now(),
    };
  },
});

// ============================================================
// Internal mutations that the seed action calls.
// ============================================================
// Each looks up by its unique key first; existing rows are patched
// (idempotent), missing rows are inserted. Queries are admin-bypassed
// because this code runs inside an `action` invocation that already
// gate-checks at the dashboard level.
import { internalMutation } from "./_generated/server";
import { v as convV } from "convex/values";

// We declare these in the same file (allowed by Convex) but they are
// are exported as internal so only seeded actions can call them.

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
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
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
      convV.literal("outerwear"),
      convV.literal("knitwear"),
      convV.literal("shirting"),
      convV.literal("trousers"),
      convV.literal("dresses"),
      convV.literal("leather"),
      convV.literal("accessories")
    ),
    collectionSlug: convV.string(),
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
          convV.literal("ivory")
        ),
      })
    ),
    sizes: convV.array(
      convV.object({ id: convV.string(), label: convV.string() })
    ),
    badges: convV.array(
      convV.union(
        convV.literal("new"),
        convV.literal("restocked"),
        convV.literal("limited"),
        convV.literal("editorial"),
        convV.literal("exclusive")
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
        convV.literal("ivory")
      )
    ),
    imageUrls: convV.optional(convV.array(convV.string())),
    status: convV.union(
      convV.literal("draft"),
      convV.literal("published"),
      convV.literal("archived")
    ),
    featured: convV.boolean(),
    trending: convV.boolean(),
    editorial: convV.boolean(),
    visible: convV.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("products", args);
  },
});

export const upsertVariant = internalMutation({
  args: {
    productId: convV.id("products"),
    sku: convV.string(),
    size: convV.string(),
    color: convV.string(),
    stock: convV.number(),
    available: convV.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("variants")
      .withIndex("by_sku", (q) => q.eq("sku", args.sku))
      .unique();
    if (existing) {
      // Don't touch stock on re-seed (someone may have consumed it).
      await ctx.db.patch(existing._id, {
        productId: args.productId,
        size: args.size,
        color: args.color,
        available: args.available,
      });
      return existing._id;
    }
    return await ctx.db.insert("variants", args);
  },
});

export const upsertCollection = internalMutation({
  args: {
    slug: convV.string(),
    name: convV.string(),
    eyebrow: convV.string(),
    description: convV.string(),
    productSlugs: convV.array(convV.string()),
    gradient: convV.union(
      convV.literal("mist"),
      convV.literal("oat"),
      convV.literal("rose"),
      convV.literal("deep"),
      convV.literal("ivory")
    ),
    coverGradient: convV.optional(
      convV.union(
        convV.literal("mist"),
        convV.literal("oat"),
        convV.literal("rose"),
        convV.literal("deep"),
        convV.literal("ivory")
      )
    ),
    kind: convV.union(
      convV.literal("seasonal"),
      convV.literal("campaign"),
      convV.literal("editorial"),
      convV.literal("permanent")
    ),
    season: convV.optional(convV.string()),
    order: convV.number(),
    visible: convV.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("collections")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("collections", args);
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
      convV.literal("ivory")
    ),
    kind: convV.union(
      convV.literal("journal"),
      convV.literal("atelier"),
      convV.literal("campaign"),
      convV.literal("blog")
    ),
    author: convV.string(),
    publishedAt: convV.number(),
    status: convV.union(
      convV.literal("draft"),
      convV.literal("published"),
      convV.literal("archived")
    ),
    body: convV.optional(convV.string()),
    tags: convV.optional(convV.array(convV.string())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("editorials")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("editorials", args);
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
      .query("coupons")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        code,
        percentOff: args.percentOff,
        description: args.description,
        active: args.active,
      });
      return existing._id;
    }
    return await ctx.db.insert("coupons", {
      code,
      percentOff: args.percentOff,
      description: args.description,
      active: args.active,
      usedCount: 0,
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
      .query("warehouses")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args });
      return existing._id;
    }
    return await ctx.db.insert("warehouses", args);
  },
});

// ============================================================
// Seed data — mirrors src/data/catalog.ts so the existing FE
// keeps working until a future phase replaces the read path.
// ============================================================

const PRODUCTS_DATA = [
  {
    slug: "merino-overcoat-paragon",
    name: "Paragon Merino Overcoat",
    category: "outerwear" as const,
    collectionSlug: "autumn-winter",
    priceCents: 248000,
    compareAtCents: 268000,
    currency: "USD" as const,
    description:
      "An unlined overcoat cut from a 16-micron Italian merino, finished by hand in our Tuscan atelier. The shoulder is dropped by a half-inch for a quiet, considered line.",
    composition: "100% Italian merino wool. Horn buttons. Cupro lining.",
    origin: "Cut and sewn in Italy.",
    colors: [
      { id: "oat", name: "Oat Melange", gradient: "oat" as const },
      { id: "mist", name: "Pale Mist", gradient: "mist" as const },
      { id: "deep", name: "Midnight", gradient: "deep" as const },
    ],
    sizes: [
      { id: "xs", label: "XS" },
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
      { id: "xl", label: "XL" },
    ],
    badges: ["new", "editorial"] as const,
    rating: 4.9,
    reviewCount: 64,
    secondaryGradient: "mist" as const,
    status: "published" as const,
    featured: true,
    trending: true,
    editorial: true,
    visible: true,
  },
  {
    slug: "silk-cashmere-turtleneck",
    name: "Aria Silk-Cashmere Turtleneck",
    category: "knitwear" as const,
    collectionSlug: "essentials",
    priceCents: 69000,
    currency: "USD" as const,
    description:
      "A close-knit sweater drawn together from Mongolian cashmere and mulberry silk. A clean funnel collar and a structural rib at the cuff.",
    composition: "70% cashmere, 30% silk.",
    origin: "Knitted in Northern Italy.",
    colors: [
      { id: "oat", name: "Raw Ivory", gradient: "oat" as const },
      { id: "rose", name: "Rose Quartz", gradient: "rose" as const },
      { id: "mist", name: "Polar Mist", gradient: "mist" as const },
    ],
    sizes: [
      { id: "xs", label: "XS" },
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
    ],
    badges: ["restocked"] as const,
    rating: 4.8,
    reviewCount: 142,
    secondaryGradient: "rose" as const,
    status: "published" as const,
    featured: true,
    trending: false,
    editorial: false,
    visible: true,
  },
  {
    slug: "wide-leg-trouser-monolith",
    name: "Monolith Wide-Leg Trouser",
    category: "trousers" as const,
    collectionSlug: "essentials",
    priceCents: 72000,
    currency: "USD" as const,
    description:
      "A high-rise trouser pressed from a dry Japanese gabardine. The leg opens from the knee; the waist stays close. A single forward pleat sets the line.",
    composition: "100% Japanese cotton gabardine.",
    origin: "Tailored in Portugal.",
    colors: [
      { id: "oat", name: "Bone", gradient: "oat" as const },
      { id: "deep", name: "Carbon", gradient: "deep" as const },
    ],
    sizes: [
      { id: "24", label: "24" },
      { id: "26", label: "26" },
      { id: "28", label: "28" },
      { id: "30", label: "30" },
      { id: "32", label: "32" },
    ],
    badges: ["editorial"] as const,
    rating: 4.7,
    reviewCount: 88,
    secondaryGradient: "deep" as const,
    status: "published" as const,
    featured: false,
    trending: false,
    editorial: true,
    visible: true,
  },
  {
    slug: "poplin-shirt-constellation",
    name: "Constellation Poplin Shirt",
    category: "shirting" as const,
    collectionSlug: "essentials",
    priceCents: 42000,
    currency: "USD" as const,
    description:
      "A long-staple Egyptian cotton poplin, mother-of-pearl buttons, an unfused collar that holds its line after a full day's wear.",
    composition: "100% Egyptian cotton.",
    origin: "Sewn in Como.",
    colors: [
      { id: "mist", name: "Quartz White", gradient: "mist" as const },
      { id: "rose", name: "Blush", gradient: "rose" as const },
      { id: "oat", name: "Sand", gradient: "oat" as const },
    ],
    sizes: [
      { id: "xs", label: "XS" },
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
      { id: "xl", label: "XL" },
    ],
    badges: ["new"] as const,
    rating: 4.9,
    reviewCount: 211,
    secondaryGradient: "mist" as const,
    status: "published" as const,
    featured: true,
    trending: true,
    editorial: false,
    visible: true,
  },
  {
    slug: "leather-tote-glycine",
    name: "Glycine Leather Tote",
    category: "leather" as const,
    collectionSlug: "objects",
    priceCents: 185000,
    currency: "USD" as const,
    description:
      "A tote formed from a single hide of vegetable-tanned Tuscan calfskin. Will develop a quiet patina with years of wear. Saddle-stitched by hand.",
    composition: "Vegetable-tanned calfskin. Brass hardware. Unlined.",
    origin: "Hand-finished in Florence.",
    colors: [
      { id: "oat", name: "Saddle", gradient: "oat" as const },
      { id: "deep", name: "Ink", gradient: "deep" as const },
      { id: "rose", name: "Coral Skin", gradient: "rose" as const },
    ],
    sizes: [{ id: "one", label: "One Size" }],
    badges: ["limited", "editorial"] as const,
    rating: 5.0,
    reviewCount: 38,
    secondaryGradient: "oat" as const,
    status: "published" as const,
    featured: true,
    trending: false,
    editorial: true,
    visible: true,
  },
  {
    slug: "wool-crepe-slip-dress",
    name: "Whitehaven Wool-Crepe Slip Dress",
    category: "dresses" as const,
    collectionSlug: "evening",
    priceCents: 128000,
    compareAtCents: 148000,
    currency: "USD" as const,
    description:
      "A weightless column drawn in a closely-woven Italian wool crepe. Adjustable straps finished with a hand-rolled hem.",
    composition: "100% Italian wool crepe.",
    origin: "Atelier in Milan.",
    colors: [
      { id: "mist", name: "Pearl", gradient: "mist" as const },
      { id: "deep", name: "Noir", gradient: "deep" as const },
    ],
    sizes: [
      { id: "xs", label: "XS" },
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
    ],
    badges: ["new"] as const,
    rating: 4.8,
    reviewCount: 56,
    secondaryGradient: "rose" as const,
    status: "published" as const,
    featured: false,
    trending: true,
    editorial: false,
    visible: true,
  },
  {
    slug: "cashmere-scarf-soren",
    name: "Sorén Cashmere Scarf",
    category: "accessories" as const,
    collectionSlug: "objects",
    priceCents: 42000,
    currency: "USD" as const,
    description:
      "A long, gently-weighted scarf drawn from a single 200-needle cashmere. Woven on a quiet loom in northern Scotland.",
    composition: "100% Inner Mongolian cashmere.",
    origin: "Woven in Scotland.",
    colors: [
      { id: "oat", name: "Champagne", gradient: "oat" as const },
      { id: "mist", name: "Glacier", gradient: "mist" as const },
      { id: "rose", name: "Petal", gradient: "rose" as const },
    ],
    sizes: [{ id: "one", label: "180 × 50 cm" }],
    badges: ["restocked"] as const,
    rating: 4.9,
    reviewCount: 124,
    secondaryGradient: "mist" as const,
    status: "published" as const,
    featured: false,
    trending: false,
    editorial: true,
    visible: true,
  },
  {
    slug: "berlino-derby-vegetal",
    name: "Berlino Vegetal Derby",
    category: "leather" as const,
    collectionSlug: "objects",
    priceCents: 98000,
    currency: "USD" as const,
    description:
      "A blake-stitched derby with a vegetal-tanned upper and a hand-burnished toe. Built on a soft last with a low, considered waist.",
    composition: "Vegetal-tanned calfskin. Leather sole.",
    origin: "Made in Marche, Italy.",
    colors: [
      { id: "oat", name: "Saddle", gradient: "oat" as const },
      { id: "deep", name: "Espresso", gradient: "deep" as const },
    ],
    sizes: [
      { id: "39", label: "39" },
      { id: "40", label: "40" },
      { id: "41", label: "41" },
      { id: "42", label: "42" },
      { id: "43", label: "43" },
    ],
    badges: ["editorial"] as const,
    rating: 4.7,
    reviewCount: 47,
    secondaryGradient: "deep" as const,
    status: "published" as const,
    featured: false,
    trending: false,
    editorial: true,
    visible: true,
  },
  {
    slug: "structured-blazer-canon",
    name: "Canon Structured Blazer",
    category: "outerwear" as const,
    collectionSlug: "essentials",
    priceCents: 148000,
    currency: "USD" as const,
    description:
      "A precise single-breasted blazer with a half-canvas chest and a low button stance. The shoulder is unpadded; the line is clean.",
    composition: "100% Italian wool.",
    origin: "Tailored in Naples.",
    colors: [
      { id: "oat", name: "Ecru", gradient: "oat" as const },
      { id: "mist", name: "Pale Slate", gradient: "mist" as const },
      { id: "deep", name: "Slate", gradient: "deep" as const },
    ],
    sizes: [
      { id: "xs", label: "XS" },
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
    ],
    badges: ["new", "limited"] as const,
    rating: 4.8,
    reviewCount: 73,
    secondaryGradient: "mist" as const,
    status: "published" as const,
    featured: false,
    trending: true,
    editorial: false,
    visible: true,
  },
  {
    slug: "linen-trouser-callisto",
    name: "Callisto Linen Trouser",
    category: "trousers" as const,
    collectionSlug: "resort",
    priceCents: 54000,
    currency: "USD" as const,
    description:
      "A relaxed trouser in a Belgian heavyweight linen. Garment-washed for an immediate, lived-in hand.",
    composition: "100% Belgian linen.",
    origin: "Sewn in Portugal.",
    colors: [
      { id: "oat", name: "Sand", gradient: "oat" as const },
      { id: "mist", name: "Sea", gradient: "mist" as const },
    ],
    sizes: [
      { id: "xs", label: "XS" },
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
    ],
    badges: ["new"] as const,
    rating: 4.6,
    reviewCount: 61,
    secondaryGradient: "oat" as const,
    status: "published" as const,
    featured: false,
    trending: false,
    editorial: false,
    visible: true,
  },
  {
    slug: "tortoise-eyewear-athena",
    name: "Athena Tortoise Eyewear",
    category: "accessories" as const,
    collectionSlug: "objects",
    priceCents: 38000,
    currency: "USD" as const,
    description:
      "An acetate frame with a soft square lens. Cut, polished and assembled by hand in Cadore, Italy.",
    composition: "Italian Mazzucchelli acetate.",
    origin: "Made in Cadore, Italy.",
    colors: [
      { id: "oat", name: "Champagne Tortoise", gradient: "oat" as const },
      { id: "deep", name: "Midnight Tortoise", gradient: "deep" as const },
    ],
    sizes: [{ id: "one", label: "One Size" }],
    badges: ["restocked"] as const,
    rating: 4.8,
    reviewCount: 92,
    secondaryGradient: "deep" as const,
    status: "published" as const,
    featured: false,
    trending: false,
    editorial: false,
    visible: true,
  },
  {
    slug: "ponte-knit-skirt-aria",
    name: "Aria Ponte Pencil Skirt",
    category: "knitwear" as const,
    collectionSlug: "essentials",
    priceCents: 48000,
    currency: "USD" as const,
    description:
      "A knee-length pencil cut from a tightly-knit Italian ponte. Holds its narrow line through the day.",
    composition: "68% viscose, 28% nylon, 4% elastane.",
    origin: "Knitted in Italy.",
    colors: [
      { id: "deep", name: "Onyx", gradient: "deep" as const },
      { id: "mist", name: "Pearl", gradient: "mist" as const },
    ],
    sizes: [
      { id: "xs", label: "XS" },
      { id: "s", label: "S" },
      { id: "m", label: "M" },
      { id: "l", label: "L" },
    ],
    badges: ["editorial"] as const,
    rating: 4.7,
    reviewCount: 53,
    secondaryGradient: "mist" as const,
    status: "published" as const,
    featured: false,
    trending: false,
    editorial: true,
    visible: true,
  },
  {
    slug: "resort-collection-tote",
    name: "Resort Canvas Weekender",
    category: "leather" as const,
    collectionSlug: "resort",
    priceCents: 98000,
    currency: "USD" as const,
    description:
      "An oversized canvas weekender trimmed in vegetable-tanned leather. A natural companion for long weekends and shore houses.",
    composition: "Heavyweight cotton canvas. Leather trim.",
    origin: "Sewn in Portugal.",
    colors: [
      { id: "oat", name: "Ivory", gradient: "ivory" as const },
      { id: "mist", name: "Sea Mist", gradient: "mist" as const },
    ],
    sizes: [{ id: "one", label: "One Size" }],
    badges: ["new"] as const,
    rating: 4.8,
    reviewCount: 18,
    secondaryGradient: "mist" as const,
    status: "published" as const,
    featured: false,
    trending: false,
    editorial: true,
    visible: true,
  },
];

const COLLECTIONS_DATA = [
  {
    slug: "autumn-winter",
    name: "Autumn — Winter",
    eyebrow: "Volume XII",
    description:
      "Long coats, dense knits, considered evenings. The season in pieces designed to last past it.",
    productSlugs: ["p-001" /* legacy */, "merino-overcoat-paragon", "silk-cashmere-turtleneck", "wide-leg-trouser-monolith", "poplin-shirt-constellation", "structured-blazer-canon"],
    gradient: "oat" as const,
    kind: "seasonal" as const,
    season: "AW — Volume XII",
    order: 1,
    visible: true,
  },
  {
    slug: "essentials",
    name: "The Essentials",
    eyebrow: "Permanent",
    description:
      "Pieces that hold the wardrobe together. Refined twice a year, then left alone.",
    productSlugs: ["silk-cashmere-turtleneck", "wide-leg-trouser-monolith", "poplin-shirt-constellation", "structured-blazer-canon", "ponte-knit-skirt-aria"],
    gradient: "mist" as const,
    kind: "permanent" as const,
    order: 2,
    visible: true,
  },
  {
    slug: "evening",
    name: "Evening",
    eyebrow: "After Six",
    description: "Low light, high whisper. Pieces for rooms where points are made quietly.",
    productSlugs: ["wool-crepe-slip-dress", "merino-overcoat-paragon", "leather-tote-glycine", "tortoise-eyewear-athena"],
    gradient: "deep" as const,
    kind: "campaign" as const,
    order: 3,
    visible: true,
  },
  {
    slug: "objects",
    name: "Objects",
    eyebrow: "Carry With You",
    description:
      "Leather, eyewear, fragrance. The companions you reach for daily, made to age beautifully.",
    productSlugs: ["leather-tote-glycine", "cashmere-scarf-soren", "berlino-derby-vegetal", "tortoise-eyewear-athena"],
    gradient: "rose" as const,
    kind: "permanent" as const,
    order: 4,
    visible: true,
  },
  {
    slug: "resort",
    name: "Resort",
    eyebrow: "Away",
    description:
      "For rooms with windows open to the sea. Linen, canvas, fluid knits.",
    productSlugs: ["linen-trouser-callisto", "resort-collection-tote"],
    gradient: "mist" as const,
    kind: "seasonal" as const,
    season: "Resort — Volume I",
    order: 5,
    visible: true,
  },
];

const EDITORIALS_DATA = [
  {
    slug: "in-the-quiet-room",
    title: "In The Quiet Room",
    excerpt:
      "A study in low light and long shadows — photographed at our Tuscan atelier over three November afternoons.",
    coverGradient: "mist" as const,
    kind: "campaign" as const,
    author: "Editorial Office",
    publishedAt: Date.parse("2026-01-12"),
    status: "published" as const,
  },
  {
    slug: "the-patination-of-leather",
    title: "The Patination of Leather",
    excerpt:
      "How vegetable-tanned calfskin reads sunlight, rain, and the corner of a well-stacked shelf.",
    coverGradient: "oat" as const,
    kind: "atelier" as const,
    author: "Maria Venturi",
    publishedAt: Date.parse("2025-12-04"),
    status: "published" as const,
  },
  {
    slug: "a-conversation-with-the-tailor",
    title: "A Conversation With The Tailor",
    excerpt:
      "Our head tailor, Vittorio Sala, on half-canvas construction, the dropped shoulder, and the room left for the wearer.",
    coverGradient: "deep" as const,
    kind: "atelier" as const,
    author: "Editorial Office",
    publishedAt: Date.parse("2025-11-18"),
    status: "published" as const,
  },
  {
    slug: "the-permanent-wardrobe",
    title: "The Permanent Wardrobe",
    excerpt:
      "Why we list the same five pieces twice a year, and only refine them.",
    coverGradient: "mist" as const,
    kind: "journal" as const,
    author: "Lou Bertrand",
    publishedAt: Date.parse("2025-10-22"),
    status: "published" as const,
  },
];

const COUPONS_DATA = [
  { code: "WELCOME10", percentOff: 0.10, description: "First-order welcome — 10% off.", active: true },
  { code: "ÆON15", percentOff: 0.15, description: "Member code — 15% off.", active: true },
  { code: "PATRON20", percentOff: 0.20, description: "Patron program — 20% off.", active: true },
];
