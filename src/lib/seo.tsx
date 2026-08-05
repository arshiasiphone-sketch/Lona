/**
 * لونا — SEO utilities
 *
 * Lightweight, zero-dependency page metadata management for a Vite SPA.
 * Every page component calls `usePageMeta(opts)` to set:
 *   • document.title
 *   • <meta name="description">
 *   • Open Graph / Twitter Card meta tags
 *   • Canonical URL (optional)
 *
 * JSON‑LD structured‑data helpers render <script type="application/ld+json">
 * blocks that search engines understand.
 */

import { useEffect } from "react";

// ──────────────────────────────────────────────
// Page metadata
// ──────────────────────────────────────────────

export interface PageMeta {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "product" | "article";
  noindex?: boolean;
}

const BRAND = "لونا";
const SITE_URL = typeof window !== "undefined" ? window.location.origin : "";
const DEFAULT_IMAGE = `${SITE_URL}/logo.svg`;

function setMeta(id: string, name: string, content: string, isProperty = false) {
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  el.setAttribute("data-seo-id", id);
}

function removeStaleMeta(ids: string[]) {
  const keep = new Set(ids);
  // Covers <meta data-seo-id> and the <link rel=canonical data-seo-id>
  // tag so a canonical from the previous page is removed when the next
  // page does not define one.
  document.head
    .querySelectorAll("meta[data-seo-id], link[data-seo-id]")
    .forEach((el) => {
      const id = el.getAttribute("data-seo-id");
      if (id && !keep.has(id)) el.remove();
    });
}

export function usePageMeta(meta: PageMeta) {
  useEffect(() => {
    const fullTitle = meta.title.includes(BRAND) ? meta.title : `${BRAND} | ${meta.title}`;
    document.title = fullTitle;

    const ids: string[] = [];

    // Standard meta
    setMeta("desc", "description", meta.description);
    ids.push("desc");

    // Open Graph
    setMeta("og:title", "og:title", fullTitle, true);
    setMeta("og:description", "og:description", meta.description, true);
    setMeta("og:type", "og:type", meta.ogType ?? "website", true);
    setMeta("og:image", "og:image", meta.ogImage ?? DEFAULT_IMAGE, true);
    setMeta("og:url", "og:url", meta.canonical ?? window.location.href, true);
    setMeta("og:site_name", "og:site_name", BRAND, true);
    setMeta("og:locale", "og:locale", "fa_IR", true);
    ids.push("og:title", "og:description", "og:type", "og:image", "og:url", "og:site_name", "og:locale");

    // Twitter Card
    setMeta("twitter:card", "twitter:card", "summary_large_image");
    setMeta("twitter:title", "twitter:title", fullTitle);
    setMeta("twitter:description", "twitter:description", meta.description);
    setMeta("twitter:image", "twitter:image", meta.ogImage ?? DEFAULT_IMAGE);
    ids.push("twitter:card", "twitter:title", "twitter:description", "twitter:image");

    // Canonical — always managed (tag gets a data-seo-id so it is
    // included in the stale sweep); a page without a canonical clears
    // the previous page's href instead of leaking it.
    ids.push("canonical");
    let link = document.querySelector(
      "link[data-seo-id='canonical']"
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("data-seo-id", "canonical");
      document.head.appendChild(link);
    }
    if (meta.canonical) {
      link.setAttribute("href", meta.canonical);
    } else {
      link.removeAttribute("href");
    }

    // Robots
    if (meta.noindex) {
      setMeta("robots", "robots", "noindex, nofollow");
      ids.push("robots");
    }

    removeStaleMeta(ids);
  }, [meta.title, meta.description, meta.canonical, meta.ogImage, meta.ogType, meta.noindex]);
}

// ──────────────────────────────────────────────
// JSON‑LD Structured Data helpers
// ──────────────────────────────────────────────

export interface ProductSchema {
  name: string;
  description: string;
  slug: string;
  image?: string;
  price: number;
  currency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  brand?: string;
  category?: string;
  sku?: string;
  rating?: number;
  reviewCount?: number;
  colorName?: string;
  sizeLabel?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface OrganizationSchema {
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
}

function jsonLd(ld: object) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld, null, 0) }}
    />
  );
}

/** Product + optional Offer + AggregateRating */
export function ProductJsonLd(p: ProductSchema) {
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    brand: { "@type": "Brand", name: p.brand ?? BRAND },
    category: p.category ?? "لباس زیر زنانه",
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: p.currency ?? "IRT",
      availability: `https://schema.org/${p.availability ?? "InStock"}`,
      url: `${SITE_URL}/shop/${p.slug}`,
    },
  };
  if (p.image) ld.image = p.image;
  if (p.sku) ld.sku = p.sku;
  if (p.colorName) ld.color = p.colorName;
  if (p.sizeLabel) ld.size = p.sizeLabel;
  if (p.rating !== undefined && p.rating > 0) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: p.rating,
      reviewCount: p.reviewCount ?? 0,
    };
  }
  return jsonLd(ld);
}

/** BreadcrumbList */
export function BreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  });
}

/** Organization */
export function OrganizationJsonLd(o: OrganizationSchema) {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: o.name,
    url: o.url,
    logo: o.logo,
    description: o.description,
    ...(o.sameAs?.length ? { sameAs: o.sameAs } : {}),
  });
}

/** Phase 8.2 — store info shape shared by the trust schemas. */
export interface StoreInfo {
  shopName?: string;
  phone?: string;
  email?: string;
  address?: string;
  postalCode?: string;
  nationalId?: string;
  hours?: string;
  social?: Record<string, string>;
  enamadCode?: string;
}

/** LocalBusiness + ContactPoint — trust signals for Iranian ecommerce. */
export function LocalBusinessJsonLd(s: StoreInfo) {
  const name = s.shopName || "لونا";
  const contact: Record<string, unknown> = {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: "fa",
  };
  if (s.phone) contact.telephone = s.phone;
  if (s.email) contact.email = s.email;

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "ClothingStore"],
    name,
    url: typeof window !== "undefined" ? window.location.origin : undefined,
    image: `${typeof window !== "undefined" ? window.location.origin : ""}/logo.svg`,
    contactPoint: contact,
  };
  if (s.address) ld.address = { "@type": "PostalAddress", streetAddress: s.address };
  if (s.postalCode) {
    const address =
      typeof ld.address === "object" && ld.address !== null
        ? ld.address
        : {};
    ld.address = { ...address, postalCode: s.postalCode };
  }
  if (s.hours) ld.openingHours = s.hours;
  if (s.nationalId) ld.identifier = `IR-${s.nationalId}`;
  const sameAs = Object.values(s.social ?? {}).filter(
    (v): v is string => Boolean(v && /^https?:\/\//.test(v)),
  );
  if (sameAs.length) ld.sameAs = sameAs;
  return jsonLd(ld);
}
