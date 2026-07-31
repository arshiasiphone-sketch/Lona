/**
 * لونا — Product feed architecture
 *
 * Prepares the data model for future marketplace integration
 * (ترب, دیجی‌کالا, Google Merchant Center, etc.).
 *
 * Each function maps from the internal Lona product shape to
 * a standardized external feed format. Keep these adapters
 * pure — no side effects, no network calls.
 *
 * Usage (future):
 *   const feed = generateFeed(products);
 *   // Output as XML, JSON, CSV, etc.
 */

import type { Product as CatalogProduct } from "@/data/catalog";

// ──────────────────────────────────────────────
// Standardised feed item
// ──────────────────────────────────────────────

export interface FeedItem {
  /** Unique identifier — matches the Lona slug. */
  id: string;
  /** Persian product title. */
  title: string;
  /** Persian description (max 500 chars for marketplace feeds). */
  description: string;
  /** Absolute URL to the product page. */
  link: string;
  /** Absolute URL to the primary product image. */
  image_link: string;
  /** Additional image URLs (comma-separated or array). */
  additional_image_links: string[];
  /** Price in Toman (integer). */
  price: number;
  /** Currency code — IRT for Toman. */
  currency: string;
  /** Availability: "in stock" | "out of stock" | "preorder". */
  availability: "in stock" | "out of stock" | "preorder";
  /** Brand name. */
  brand: string;
  /** Google product category (ID) or local taxonomy path. */
  google_product_category?: string;
  /** Product condition: always "new" for Lona. */
  condition: "new";
  /** GTIN / barcode — placeholder for future. */
  gtin?: string;
  /** MPN (Manufacturer Part Number) — maps to internal SKU. */
  mpn?: string;
  /** Sizes available (pipe-separated or array). */
  sizes: string[];
  /** Colors available. */
  colors: string[];
  /** Gender — always "female" for Lona. */
  gender: "female";
  /** Age group — "adult". */
  age_group: "adult";
}

// ──────────────────────────────────────────────
// Category mapping — Lona taxonomy → Google product taxonomy
// ──────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  bras: "Apparel & Accessories > Clothing > Underwear & Socks > Bras",
  briefs: "Apparel & Accessories > Clothing > Underwear & Socks > Underwear",
  sets: "Apparel & Accessories > Clothing > Underwear & Socks > Underwear Sets",
  sleepwear: "Apparel & Accessories > Clothing > Sleepwear & Loungewear",
  loungewear: "Apparel & Accessories > Clothing > Sleepwear & Loungewear",
  bodysuits: "Apparel & Accessories > Clothing > Underwear & Socks > Bodysuits",
  shapewear: "Apparel & Accessories > Clothing > Underwear & Socks > Shapewear",
  sportswear: "Apparel & Accessories > Clothing > Activewear",
  accessories: "Apparel & Accessories > Clothing Accessories",
  bridal: "Apparel & Accessories > Clothing > Underwear & Socks > Bras",
};

// ──────────────────────────────────────────────
// Adapter: CatalogProduct → FeedItem
// ──────────────────────────────────────────────

export function toFeedItem(
  p: CatalogProduct,
  origin: string = typeof window !== "undefined" ? window.location.origin : "",
): FeedItem {
  const imageUrls = p.imageUrls ?? [];
  return {
    id: p.slug,
    title: p.name,
    description: p.description.slice(0, 500),
    link: `${origin}/shop/${p.slug}`,
    image_link: imageUrls[0] ?? "",
    additional_image_links: imageUrls.slice(1),
    price: p.price,
    currency: "IRT",
    availability: "in stock",
    brand: "لونا",
    google_product_category: CATEGORY_MAP[p.category],
    condition: "new",
    sizes: p.sizes.map((s) => s.label),
    colors: p.colors.map((c) => c.name),
    gender: "female",
    age_group: "adult",
  };
}

/** Generate a full product feed from the catalog. */
export function generateFeed(products: CatalogProduct[], origin?: string): FeedItem[] {
  return products.map((p) => toFeedItem(p, origin));
}

/** Generate a minimal JSON feed (suitable for ترب / Torob). */
export function generateTorobFeed(products: CatalogProduct[], origin?: string) {
  return products.map((p) => {
    const item = toFeedItem(p, origin);
    return {
      page_url: item.link,
      title: item.title,
      image_url: item.image_link,
      current_price: item.price,
      availability: item.availability === "in stock" ? "instock" : "outofstock",
      currency: "toman",
    };
  });
}
