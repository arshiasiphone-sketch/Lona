/**
 * Phase 4.5 — Live Data Migration Layer.
 *
 * Bridges the legacy "Product / Editorial" shapes (used by
 * the locked Phase 1–3 UI) and the live Convex schema. Public surface
 * is intentionally identical to `src/data/catalog.ts` so the existing
 * components keep working without edits — only the *source* of truth
 * moved to Convex.
 *
 * Strategy
 * ────────
 *   • All hooks return the legacy `Product | Editorial`
 *     interface defined here (re-exported via `@/data/catalog`-shaped
 *     types already used by components).
 *
 *   • Lists (useProducts, useEditorials, …) read from
 *     Convex only. While the live query is loading, they return
 *     `undefined` — the Phase-2 skeleton states already cover that
 *     case in the page components.
 *
 *   • Single-row lookups (useProduct, useEditorial)
 *     use live Convex data only. A missing row is returned as `null`
 *     instead of being replaced with stale static catalog data.
 *
 *   • Money lives in cents in Convex (`priceCents`); the adapter
 *     converts to whole dollars so the locked `formatPrice` calls
 *     continue to work.
 *
 *   • Product identifiers: the legacy catalog uses both
 *     `id` ("p-001") and `slug` ("merino-overcoat-paragon"). Schema
 *     cross-references in `carts.lines.productId`,
 *     `wishlists.productIds`, `recently_viewed.productIds`, and
 *     `order_items.productId` are already opaque `v.string()` so the
 *     simplest mapping is `id === slug`. Convex `_id` is dropped from
 *     the FE surface entirely.
 */
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import type { GradientKey } from "@/lib/glass";
import {
  editorials as staticEditorials,
  newArrivals as staticNewArrivals,
  products as staticProducts,
  testimonials as staticTestimonials,
  type Editorial as StaticEditorial,
  type Product as StaticProduct,
  type Testimonial as StaticTestimonial,
  type Order as StaticOrder,
  mockOrders as staticMockOrders,
} from "@/data/catalog";

/* ────────────────────────────────────────────────────────────────
 * Re-exports — types stay where the locked UI already imports them.
 * ──────────────────────────────────────────────────────────────── */

export type Product = StaticProduct;
export type ProductCategory = StaticProduct["category"];
export type ProductColor = StaticProduct["colors"][number];
export type ProductSize = StaticProduct["sizes"][number];
export type Editorial = StaticEditorial;
export type Testimonial = StaticTestimonial;
export type Order = StaticOrder;

/* ────────────────────────────────────────────────────────────────
 *  Convex row aliases — kept internal so the FE surface is clean.
 * ──────────────────────────────────────────────────────────────── */

type ConvexProduct = Doc<"products">;
type ConvexEditorial = Doc<"editorials">;
type ConvexOrder = Doc<"orders">;
type ConvexOrderItem = Doc<"order_items">;

/* ────────────────────────────────────────────────────────────────
 *  Shape adapters — convert Convex storage to the legacy FE shape.
 * ──────────────────────────────────────────────────────────────── */

function centsToWhole(cents: number): number {
  // Phase 5.5/5.8: Toman amounts are stored directly in `priceCents`
  // and `totalCents` (no cents-of-a-currency sub-unit in toman). The
  // display formatter (`formatPrice` in `src/lib/format.ts`) treats
  // the input as the toman amount itself, so the legacy `÷ 100`
  // conversion was the wrong unit and is removed here.
  return Math.round(cents);
}

function isoFromMs(ms: number | undefined | null): string {
  if (!ms) return "";
  try {
    return new Date(ms).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function coverGradientKey(raw: string | undefined): GradientKey {
  if (raw === "mist" || raw === "oat" || raw === "rose" || raw === "deep") {
    return raw;
  }
  return "mist";
}

function adaptProduct(row: ConvexProduct): Product {
  return {
    id: row.slug,
    slug: row.slug,
    name: row.name,
    category: row.category as ProductCategory,
    price: centsToWhole(row.priceCents),
    compareAt: row.compareAtCents != null ? centsToWhole(row.compareAtCents) : undefined,
    currency: "USD",
    description: row.description,
    composition: row.composition,
    origin: row.origin,
    colors: row.colors.map((c) => ({
      id: c.id,
      name: c.name,
      gradient: coverGradientKey(c.gradient),
    })),
    sizes: row.sizes.map((s) => ({ id: s.id, label: s.label })),
    badges: row.badges.length > 0 ? (row.badges as Product["badges"]) : undefined,
    rating: row.rating ?? undefined,
    reviewCount: row.reviewCount ?? undefined,
    secondaryGradient: row.secondaryGradient
      ? coverGradientKey(row.secondaryGradient)
      : undefined,
    imageUrls: row.imageUrls?.filter((url): url is string => Boolean(url)),
  };
}

function adaptEditorial(row: ConvexEditorial): Editorial {
  return {
    id: row.slug,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: (row.kind as Editorial["category"]) ?? "journal",
    author: row.author,
    publishedAt: isoFromMs(row.publishedAt),
    cover: coverGradientKey(row.coverGradient),
    coverImage: row.coverImage ?? undefined,
  };
}

/* ────────────────────────────────────────────────────────────────
 *  Pure helpers (compatible with the legacy API)
 * ──────────────────────────────────────────────────────────────── */

export function getProductByIdFromList(
  list: Product[] | undefined,
  id: string
): Product | undefined {
  if (!list) return undefined;
  return list.find((p) => p.id === id || p.slug === id);
}

export function getProductBySlug(list: Product[] | undefined, slug: string) {
  if (!list) return undefined;
  return list.find((p) => p.slug === slug);
}

/* ────────────────────────────────────────────────────────────────
 *  Hooks — products
 * ──────────────────────────────────────────────────────────────── */

export interface UseProductsArgs {
  category?: ProductCategory;
  featured?: boolean;
  trending?: boolean;
  editorial?: boolean;
  limit?: number;
}

/** Reactive list. Returns `undefined` while Convex is still loading. */
export function useProducts(args: UseProductsArgs = {}): Product[] | undefined {
  const { category, limit } = args;

  // When no narrowing applies, use the unfiltered list query.
  const noNarrowing =
    !category && !args.featured && !args.trending && !args.editorial;
  const base = useQuery(
    api.products.list,
    noNarrowing ? (limit ? { limit } : {}) : "skip"
  );

  const featured = useQuery(
    api.products.featured,
    args.featured && !category ? {} : "skip"
  );
  const trending = useQuery(
    api.products.trending,
    args.trending && !category ? {} : "skip"
  );
  const editorial = useQuery(
    api.products.editorial,
    args.editorial && !category ? {} : "skip"
  );
  const byCategory = useQuery(
    api.products.byCategory,
    category ? { category } : "skip"
  );

  const picked =
    base ??
    featured ??
    trending ??
    editorial ??
    byCategory ??
    undefined;

  const adapted = useMemo(
    () => (picked ? picked.map(adaptProduct) : undefined),
    [picked]
  );

  return useMemo(() => {
    if (!adapted) return undefined;
    return limit ? adapted.slice(0, limit) : adapted;
  }, [adapted, limit]);
}

export function useProduct(slugOrId: string | undefined): Product | null | undefined {
  const slug = slugOrId;

  // Try slug lookup first.
  const bySlug = useQuery(
    api.products.getBySlug,
    slug ? { slug } : "skip"
  );

  // If the input looked like a slug (no fast-match), fall through.
  // We don't have a getById endpoint — id === slug in this shape.

  // Live data path
  const live = useMemo(() => {
    if (bySlug === undefined) return undefined;
    return bySlug ? adaptProduct(bySlug) : null;
  }, [bySlug]);

  return live;
}

export function useFeaturedProducts(limit?: number): Product[] | undefined {
  return useProducts({ featured: true, limit });
}

export function useTrendingProducts(limit?: number): Product[] | undefined {
  return useProducts({ trending: true, limit });
}

export function useEditorialProducts(limit?: number): Product[] | undefined {
  return useProducts({ editorial: true, limit });
}

export function useNewArrivals(limit?: number): Product[] | undefined {
  // "New" maps cleanly to the `new` badge. Once live data carries it,
  // we read it from the listing and filter.
  const list = useProducts();
  return useMemo(() => {
    if (!list) return undefined;
    const filtered = list.filter((p) => p.badges?.includes("new"));
    return limit ? filtered.slice(0, limit) : filtered;
  }, [list, limit]);
}

export function useProductsByCategory(
  category: ProductCategory
): Product[] | undefined {
  return useProducts({ category });
}

export interface UseSearchArgs {
  query: string;
  category?: ProductCategory;
  limit?: number;
}

export function useSearchProducts({
  query,
  category,
  limit = 24,
}: UseSearchArgs): Product[] | undefined {
  const trimmed = query.trim();
  const remote = useQuery(
    api.products.search,
    trimmed
      ? { query: trimmed, category, limit }
      : "skip"
  );

  const adapted = useMemo(
    () => (remote ? remote.map(adaptProduct) : undefined),
    [remote]
  );

  return adapted as Product[] | undefined;
}

/* ────────────────────────────────────────────────────────────────
 *  Hooks — editorials
 * ──────────────────────────────────────────────────────────────── */

export function useEditorials(): Editorial[] | undefined {
  const remote = useQuery(api.editorials.listPublished, {});
  return useMemo(
    () =>
      remote
        ? remote
            .map(adaptEditorial)
            .sort((a: Editorial, b: Editorial) => (a.publishedAt < b.publishedAt ? 1 : -1))
        : undefined,
    [remote]
  );
}

export function useEditorial(
  slug: string | undefined
): Editorial | null | undefined {
  const remote = useQuery(
    api.editorials.getBySlug,
    slug ? { slug } : "skip"
  );

  const live = useMemo(() => {
    if (remote === undefined) return undefined;
    return remote ? adaptEditorial(remote) : null;
  }, [remote]);

  return live;
}

/* ────────────────────────────────────────────────────────────────
 *  Hooks — reviews
 * ──────────────────────────────────────────────────────────────── */

export interface ReviewSummary {
  rating: number | null;
  count: number;
}

export function useReviewSummary(
  productId: string | undefined
): ReviewSummary | undefined {
  const remote = useQuery(
    api.reviews.summaryByProduct,
    productId ? { productId } : "skip"
  );

  return useMemo(() => {
    if (remote === undefined) return undefined;
    return { rating: remote.rating, count: remote.count };
  }, [remote]);
}

/* ────────────────────────────────────────────────────────────────
 *  Hooks — orders
 * ──────────────────────────────────────────────────────────────── */

export interface AdaptedOrder {
  id: string;
  number: string;
  placedAt: string;
  status: "processing" | "shipped" | "delivered" | "returning" | "pending" | "cancelled";
  total: number;
  items: { productId: string; quantity: number; size: string; color: string }[];
  trackingNumber?: string;
}

function adaptOrder(order: ConvexOrder, items: ConvexOrderItem[]): AdaptedOrder {
  return {
    id: order._id,
    number: order.number,
    placedAt: isoFromMs(order.placedAt),
    status: order.status as AdaptedOrder["status"],
    total: centsToWhole(order.totalCents),
    items: items.map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      size: it.size,
      color: it.color,
    })),
    trackingNumber: order.shipping.trackingNumber ?? undefined,
  };
}

export function useOrdersByUser(): AdaptedOrder[] | undefined {
  const remote = useQuery(api.orders.listMineWithItems, {});
  return useMemo(() => {
    if (remote === undefined) return undefined;
    return remote.map((entry: { order: ConvexOrder; items: ConvexOrderItem[] }) =>
      adaptOrder(entry.order, entry.items)
    );
  }, [remote]);
}

/* ────────────────────────────────────────────────────────────────
 *  Static fallback re-exports (kept for non-migrated call sites).
 * ──────────────────────────────────────────────────────────────── */

export {
  staticEditorials,
  staticProducts,
  staticTestimonials,
  staticNewArrivals,
  staticMockOrders,
};
