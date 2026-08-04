/**
 * Lona — canonical money module (Phase 8.1).
 *
 * Single source of truth for every money value in the app: Persian
 * Toman formatting, integer-only arithmetic and rounding. All other
 * modules (components, admin pages, checkout) import from here — the
 * legacy `format.ts` re-exports this module so old imports keep
 * working unchanged.
 *
 * Storage convention: `*Cents` fields hold Toman minor units as
 * integers (e.g. 2480000 = ۲٬۴۸۰٬۰۰۰ تومان). We never use floats for
 * money; every computation here is integer math.
 */

const TOMAN_FORMATTER = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 0,
});

const NUMBER_FORMATTER = new Intl.NumberFormat("fa-IR");

const DATE_FORMATTER = new Intl.DateTimeFormat("fa-IR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const DATE_SHORT = new Intl.DateTimeFormat("fa-IR", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("fa-IR", {
  hour: "2-digit",
  minute: "2-digit",
});

/* ──────────────────────────────────────────────────────────────
 * Integer money arithmetic (never floats)
 * ────────────────────────────────────────────────────────────── */

/** Round to the nearest integer (money never carries decimals). */
export function round(value: number): number {
  return Math.round(value);
}

/** Safe integer addition. */
export function add(a: number, b: number): number {
  return a + b;
}

/** Safe integer multiplication with rounding (qty × unit price). */
export function multiply(a: number, b: number): number {
  return Math.round(a * b);
}

/** Clamp to zero — discounts/totals can never go negative. */
export function clampToZero(value: number): number {
  return Math.max(0, value);
}

/**
 * Percentage of an amount, rounded to the nearest integer.
 * `percent(2_480_000, 0.15) → 372000`.
 */
export function percentOf(amount: number, rate: number): number {
  const clamped = Math.min(Math.max(rate, 0), 1);
  return Math.round(amount * clamped);
}

/** Grand total: subtotal − discount + shipping (+tax). Never negative. */
export function grandTotal(input: {
  subtotal: number;
  discount: number;
  shipping: number;
  tax?: number;
}): number {
  return clampToZero(
    input.subtotal - input.discount + input.shipping + (input.tax ?? 0)
  );
}

/* ──────────────────────────────────────────────────────────────
 * Formatting
 * ────────────────────────────────────────────────────────────── */

/**
 * Format an integer ("minor unit") amount as Persian Toman.
 * Output: "۲٬۴۸۰٬۰۰۰ تومان".
 *
 * The `_decimals` flag is accepted for backward compatibility with
 * legacy callers; Toman amounts never display decimals.
 */
export function formatPrice(amount: number, _decimals: boolean = false): string {
  return `${TOMAN_FORMATTER.format(Math.round(amount))} تومان`;
}

/** Compact Toman display for KPIs/charts: "۲٫۴ م تومان" suffixes. */
export function formatPriceCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} میلیارد تومان`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} م تومان`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)} هزار تومان`;
  }
  return formatPrice(amount);
}

/** Persian digit formatting for generic numbers. */
export function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

/** Persian digit-only formatting for stock counts, badges, etc. */
export function formatCount(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

/** Discount copy in Persian: "۲۰٪ −". */
export function formatDiscount(price: number, compareAt?: number): string | null {
  if (!compareAt || compareAt <= price) return null;
  const pct = Math.round(((compareAt - price) / compareAt) * 100);
  return `${TOMAN_FORMATTER.format(pct)}٪−`;
}

export function formatDate(input: string | Date | number): string {
  const d = input instanceof Date ? input : new Date(input);
  return DATE_FORMATTER.format(d);
}

export function formatDateShort(input: string | Date | number): string {
  const d = input instanceof Date ? input : new Date(input);
  return DATE_SHORT.format(d);
}

export function formatTime(input: string | Date | number): string {
  const d = input instanceof Date ? input : new Date(input);
  return TIME_FORMATTER.format(d);
}

/** Persian relative time: "امروز" / "دیروز" / "۳ روز پیش". */
export function formatRelative(input: string | Date | number): string {
  const d = input instanceof Date ? input : new Date(input);
  const diff = Date.now() - d.getTime();
  const day = 86_400_000;
  if (diff < day && diff > -day) return "امروز";
  if (diff < day * 2 && diff > -day * 2) return "دیروز";
  if (diff < day * 7 && diff > -day * 7)
    return `${NUMBER_FORMATTER.format(Math.floor(Math.abs(diff) / day))} روز پیش`;
  return formatDate(d);
}

/**
 * Truncate a UTF-8 string by code points (Persian combining marks safe).
 */
export function truncate(value: string, max = 80): string {
  if (!value) return "";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Legacy order-number formatter (admin shorthand) — kept for
 * compatibility; real orders carry their own `Æ-YYMMDD-XXXX` number.
 */
export function formatOrderNumber(n: string | number): string {
  return `LN-${String(n).padStart(8, "0")}`;
}

/** Admin shorthand — same as formatPrice. */
export const formatToman = (amount: number, decimals = false) =>
  formatPrice(amount, decimals);
export const CURRENCY_CODE = "IRT" as const;
/** Display label. */
export const CURRENCY_LABEL = "تومان" as const;
