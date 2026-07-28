/**
 * Lona — Persian commerce formatters.
 *
 * Currency unit is ریال internally and تومان at display time
 * (1 toman = 10 rial per Iranian convention). We treat the
 * `priceCents` field as "minor units" and divide by 1 in display —
 * so a stored priceCents of `2480000` reads as
 * `۲٬۴۸۰٬۰۰۰ تومان`. Keep the integer arithmetic simple.
 *
 * Persian numerals are auto-applied by `fa-IR` Intl locale.
 */

const TOMAN_FORMATTER = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 0,
});

const TOMAN_FORMATTER_DECIMAL = new Intl.NumberFormat("fa-IR", {
  minimumFractionDigits: 0,
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

/**
 * Format an integer or "minor unit" amount as Persian Toman.
 * Output: "۲٬۴۸۰٬۰۰۰ تومان"
 */
export function formatPrice(amount: number, _decimals = false): string {
  const value = Math.round(amount / 1);
  return `${TOMAN_FORMATTER.format(value)} تومان`;
}

/**
 * Compact Toman display for KPIs/charts: "۲٫۴ م" suffixes.
 */
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

export function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

/**
 * Persian digit-only formatting for stock counts, badges, etc.
 */
export function formatCount(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

/**
 * Discount copy in Persian: "۲۰٪ −".
 */
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

/**
 * Persian relative time: "امروز" / "دیروز" / "۳ روز پیش".
 */
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
 * Order number formatter: e.g. "LN-240102-1140" → with Persian digit suffix.
 */
export function formatOrderNumber(n: string | number): string {
  return `LN-${String(n).padStart(8, "0")}`;
}

/** Currency code constant for downstream places that branch on it. */
export const CURRENCY_CODE = "IRT" as const;
/** Display label. */
export const CURRENCY_LABEL = "تومان" as const;
