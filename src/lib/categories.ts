/**
 * LONA — product category labels.
 *
 * `products.category` stores a stable English slug (the schema literal).
 * Every user-facing surface renders the Persian label instead, so the
 * storefront never shows raw slugs. Shared by the product page, cards,
 * the command palette and the admin wizard.
 */

export const CATEGORY_LABELS_FA: Record<string, string> = {
  bras: "سوتین",
  briefs: "شورت",
  sets: "ست لباس زیر",
  sleepwear: "لباس خواب",
  loungewear: "لانژری",
  bodysuits: "بادی‌سوت",
  shapewear: "شکل‌دهنده",
  sportswear: "ورزشی",
  accessories: "اکسسوری",
  bridal: "عروس",
};

/** Persian label for a category slug; falls back to the slug itself. */
export function categoryLabelFa(slug: string | undefined | null): string {
  if (!slug) return "";
  return CATEGORY_LABELS_FA[slug] ?? slug;
}
