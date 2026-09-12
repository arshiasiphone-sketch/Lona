/**
 * Phase 5.8 — FE static fallback mirror.
 *
 * Thin adapter over `src/data/lona-catalog.ts`. Re-exposes the
 * legacy `Product | Editorial | Order | Testimonial`
 * shape so the locked Phase 1–3 UI keeps working, while the actual
 * data lives in the single source-of-truth file.
 *
 * Used by:
 *   • `src/lib/data/catalog.ts` (useProducts fallback) — primary
 *   • `src/data/catalog.ts` direct consumers (legacy filter panel,
 *     legacy mockorders, legacy testimonials) — kept for
 *     backwards compatibility until those migrate to Convex.
 */
import type { GradientKey } from "@/lib/glass";
import {
  LONA_PRODUCTS,
  LONA_EDITORIALS,
  LONA_CATEGORIES,
  LINGERIE_SIZES,
  ACCESSORY_SIZES,
  LONA_COLOR_OPTIONS,
  type LonaProductRaw,
} from "@/data/lona-catalog";

// ──────────────────────────────────────────────────────────────
// CATEGORY UNION — Phase 5.8 lingerie taxonomy supersedes the
// generic fashion taxonomy that existed through Phase 5.5.
// ──────────────────────────────────────────────────────────────
export type ProductCategory =
  | "bras"
  | "briefs"
  | "sets"
  | "sleepwear"
  | "loungewear"
  | "bodysuits"
  | "shapewear"
  | "sportswear"
  | "accessories"
  | "bridal";

export interface ProductColor {
  id: string;
  name: string;
  gradient: GradientKey;
}

export interface ProductSize {
  id: string;
  label: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  price: number;
  compareAt?: number;
  currency: "USD";
  description: string;
  composition: string;
  origin: string;
  colors: ProductColor[];
  sizes: ProductSize[];
  badges?: ("new" | "restocked" | "limited" | "editorial")[];
  rating?: number;
  reviewCount?: number;
  secondaryGradient?: GradientKey;
  /** Optional — Phase 5.8 image URLs (live data uses Convex). */
  imageUrls?: string[];
}

export interface Editorial {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: "journal" | "atelier" | "campaign" | "blog";
  author: string;
  publishedAt: string;
  cover: string;
  /** Phase 7.4 — real cover image URL (admin-uploaded); gradient remains fallback. */
  coverImage?: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
}

export interface Order {
  id: string;
  number: string;
  placedAt: string;
  status: "processing" | "shipped" | "delivered" | "returning";
  total: number;
  items: { productId: string; quantity: number; size: string; color: string }[];
  trackingNumber?: string;
}

// ──────────────────────────────────────────────────────────────
// ADAPTER — LonaProductRaw → legacy Product
// ──────────────────────────────────────────────────────────────

function colorFromId(id: string): ProductColor | null {
  const def = LONA_COLOR_OPTIONS.find((c) => c.id === id);
  if (!def) return null;
  return { id: def.id, name: def.name, gradient: def.gradient };
}

function sizeFromId(id: string): ProductSize | null {
  const def =
    [...LINGERIE_SIZES, ...ACCESSORY_SIZES].find((s) => s.id === id) ?? null;
  if (!def) return null;
  return { id: def.id, label: def.label };
}

function adaptProduct(p: LonaProductRaw): Product {
  return {
    id: p.slug,
    slug: p.slug,
    name: p.name,
    category: p.category as ProductCategory,
    price: p.price,
    compareAt: p.compareAt,
    currency: "USD",
    description: p.description,
    composition: p.composition,
    origin: p.origin,
    colors: p.colors.map(colorFromId).filter((c): c is ProductColor => c !== null),
    sizes: p.sizes.map(sizeFromId).filter((s): s is ProductSize => s !== null),
    badges: p.badges.length > 0 ? (p.badges as Product["badges"]) : undefined,
    rating: p.rating,
    reviewCount: p.reviewCount,
    secondaryGradient: p.secondaryGradient,
    imageUrls: p.imageUrls,
  };
}

function adaptEditorial(e: (typeof LONA_EDITORIALS)[number]): Editorial {
  return {
    id: e.slug,
    slug: e.slug,
    title: e.title,
    excerpt: e.excerpt,
    category: e.kind as Editorial["category"],
    author: e.author,
    publishedAt: new Date(e.publishedAt).toISOString().slice(0, 10),
    cover: e.coverGradient,
    coverImage: undefined,
  };
}

// ──────────────────────────────────────────────────────────────
// PUBLIC SURFACE — mirror the legacy static catalog
// ──────────────────────────────────────────────────────────────

export const products: Product[] = LONA_PRODUCTS.map(adaptProduct);
export const editorials: Editorial[] = LONA_EDITORIALS.map(adaptEditorial);

// Categories array — used by Phase 5 legacy filter consumers that haven't
// migrated to the lingerie taxonomy yet. Each entry is a slimmer shape.
export const categories = LONA_CATEGORIES.map((c) => ({
  slug: c.slug,
  name: c.name,
  description: c.description,
  order: c.order,
  visible: c.visible,
}));

// ──────────────────────────────────────────────────────────────
// HELPERS (legacy API)
// ──────────────────────────────────────────────────────────────

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id || p.slug === id);
}

export function newArrivals(limit?: number): Product[] {
  const filtered = products.filter((p) => p.badges?.includes("new"));
  return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
}

export function featuredProducts(limit?: number): Product[] {
  const featured = LONA_PRODUCTS.filter((p) => p.featured).map((p) => p.slug);
  const list = products.filter((p) => featured.includes(p.slug));
  return typeof limit === "number" ? list.slice(0, limit) : list;
}

export function trendingProducts(limit?: number): Product[] {
  const trending = LONA_PRODUCTS.filter((p) => p.trending).map((p) => p.slug);
  const list = products.filter((p) => trending.includes(p.slug));
  return typeof limit === "number" ? list.slice(0, limit) : list;
}

export function bestSellers(limit?: number): Product[] {
  // Best sellers ≈ highest reviewCount × rating.
  const sorted = [...products].sort(
    (a, b) => (b.reviewCount ?? 0) * (b.rating ?? 0) - (a.reviewCount ?? 0) * (a.rating ?? 0)
  );
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

// Lightweight testimonial pool — five curated Persian quotes for the
// home-page Testimonials section. Authors are seed placeholders.
export const testimonials: Testimonial[] = [
  { id: "t-1", quote: "کیفیت پارچه و دوخت لونا از هر برند دیگری که تجربه کردم بالاتره. بسته‌بندی محرمانه هم برای من مهم بود.", author: "مریم احمدی",     role: "مشتری وفادار" },
  { id: "t-2", quote: "سایزبندی‌ها دقیقاً مطابق جدول سایز لونا هست. تیم پشتیبانی هم در انتخاب سایز کمک کرد.",                              author: "زهرا کریمی",     role: "مشتری تازه" },
  { id: "t-3", quote: "برای شب عروسی دنبال یک ست خاص بودم. ست رویای لونا را انتخاب کردم و شب فراموش‌نشدنی شد.",                                author: "نگار رضایی",    role: "عروس" },
  { id: "t-4", quote: "راحتی روزانه‌ی محصولات نرم لونا واقعاً با‌کیفیته. از خریدم هیچ‌وقت پشیمان نشدم.",                                            author: "مونا فلاحی",    role: "مشتری ماهانه" },
  { id: "t-5", quote: "ارسال سریع، بسته‌بندی شیک و محرمانه، و کیفیتی که از یک برند لوکس انتظار دارید.",                                              author: "رویا شفیعی",    role: "مشتری وفادار" },
];

// Mock order history — used only in the dashboard / admin seeder path.
// Each entry references one product by slug. Kept tiny on purpose.
export const mockOrders: Order[] = [
  {
    id: "MO-2401",
    number: "LN-00001",
    placedAt: "2025-12-04",
    status: "delivered",
    total: 1_290_000,
    items: [{ productId: products[0]!.slug, quantity: 1, size: "m", color: "beige" }],
    trackingNumber: "LN-241220-0041",
  },
  {
    id: "MO-2402",
    number: "LN-00002",
    placedAt: "2025-12-18",
    status: "shipped",
    total: 2_490_000,
    items: [
      { productId: products[0]!.slug, quantity: 1, size: "s", color: "black" },
      { productId: products[1]!.slug, quantity: 1, size: "one", color: "rose" },
    ],
    trackingNumber: "LN-241230-0093",
  },
  {
    id: "MO-2403",
    number: "LN-00003",
    placedAt: "2026-01-02",
    status: "processing",
    total: 1_690_000,
    items: [{ productId: products[2]!.slug, quantity: 1, size: "l", color: "navy" }],
  },
];
