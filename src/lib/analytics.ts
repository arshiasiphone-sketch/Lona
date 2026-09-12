/**
 * لونا — Analytics foundation
 *
 * Provider-agnostic event tracking layer. Currently a no-op stub that
 * future integrations (Google Analytics, Meta Pixel, Microsoft Clarity,
 * Hotjar, etc.) can wire into without changing any consumer code.
 *
 * Usage:
 *   import { track } from "@/lib/analytics";
 *   track("view_product", { productId: "x", name: "y" });
 *
 * All event payloads are type-safe. Add new events to `AnalyticsEvent`
 * as the product grows.
 */

// ──────────────────────────────────────────────
// Event type registry
// ──────────────────────────────────────────────

export interface AnalyticsEventMap {
  view_product: { productId: string; name: string; category?: string; price?: number };
  add_to_cart: { productId: string; name: string; price: number; quantity: number; size?: string; color?: string };
  remove_from_cart: { productId: string; name: string };
  begin_checkout: { itemCount: number; total: number; coupon?: string };
  add_payment_info: { method?: string };
  purchase: { orderNumber: string; total: number; itemCount: number; coupon?: string };
  wishlist_add: { productId: string; name: string };
  wishlist_remove: { productId: string; name: string };
  search: { query: string; resultsCount: number };
}

export type AnalyticsEventName = keyof AnalyticsEventMap;

// ──────────────────────────────────────────────
// Provider interface
// ──────────────────────────────────────────────

export interface AnalyticsProvider {
  name: string;
  track: <T extends AnalyticsEventName>(event: T, payload: AnalyticsEventMap[T]) => void;
  pageView?: (path: string, title: string) => void;
}

// ──────────────────────────────────────────────
// Internal provider registry
// ──────────────────────────────────────────────

const providers: AnalyticsProvider[] = [];

export function registerProvider(provider: AnalyticsProvider): void {
  if (providers.some((p) => p.name === provider.name)) {
    if (import.meta.env.DEV) console.warn(`[analytics] Provider "${provider.name}" already registered.`);
    return;
  }
  providers.push(provider);
}

// ──────────────────────────────────────────────
// Public track function — calls every registered provider
// ──────────────────────────────────────────────

export function track<T extends AnalyticsEventName>(
  event: T,
  payload: AnalyticsEventMap[T],
): void {
  if (import.meta.env.DEV) {
    console.debug(`[analytics] ${event}`, payload);
  }
  for (const provider of providers) {
    try {
      provider.track(event, payload as any);
    } catch (err) {
      if (import.meta.env.DEV) console.warn(`[analytics] Provider "${provider.name}" error:`, err);
    }
  }
}

/** Call after each route change (use in a top-level useEffect). */
export function trackPageView(path: string, title: string): void {
  for (const provider of providers) {
    try {
      provider.pageView?.(path, title);
    } catch {
      /* silent in production */
    }
  }
}
