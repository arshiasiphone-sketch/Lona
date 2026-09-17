/**
 * LONA — canonical Iranian mobile number utilities.
 *
 * This module is the SINGLE source of truth for phone normalization in
 * the project. It is intentionally dependency-free and runtime-neutral
 * so that BOTH sides of the app import the exact same logic:
 *
 *   • server: `src/convex/auth/phoneOtp.ts` (Convex Auth Phone provider)
 *   • client: `src/pages/Auth.tsx` (login form) + admin team screens
 *
 * The client normalizes for UX; the server normalizes again because
 * frontend input can never be trusted. There is exactly one canonical
 * representation:
 *
 *   +98 9XX XXX XXXX      (e.g. +989121234567)
 *
 * Accepted user input:
 *   09121234567        (national, leading zero)
 *   9121234567         (national, missing leading zero)
 *   +989121234567      (E.164)
 *   00989121234567     (international prefix)
 *   0098 912 123 4567  (any spacing / dash / dot separators)
 *   ۰۹۱۲۱۲۳۴۵۶۷         (Persian digits)
 *   ٠٩١٢١٢٣٤٥٦٧         (Arabic-Indic digits)
 *   ۰۹۱۲،۱۲۳ ۴۵۶۷      (Persian punctuation / bidi marks from a paste)
 */

/** Iranian mobile prefixes assigned to MCI / Irancell / Rightel / Shatel. */
const IRAN_MOBILE_PREFIXES = [
  "990",
  "991",
  "992",
  "993",
  "994",
  "995",
  "996",
  "900",
  "901",
  "902",
  "903",
  "904",
  "905",
  "930",
  "933",
  "935",
  "936",
  "937",
  "938",
  "939",
  "910",
  "911",
  "912",
  "913",
  "914",
  "915",
  "916",
  "917",
  "918",
  "919",
  "920",
  "921",
  "922",
  "923",
  "924",
  "925",
  "926",
  "927",
  "928",
  "929",
  "941",
  "942",
  "943",
  "944",
] as const;

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Convert Persian/Arabic-Indic digits to ASCII digits. */
export function toAsciiDigits(input: string): string {
  let out = "";
  for (const char of input) {
    const persian = PERSIAN_DIGITS.indexOf(char);
    if (persian !== -1) {
      out += String(persian);
      continue;
    }
    const arabic = ARABIC_DIGITS.indexOf(char);
    if (arabic !== -1) {
      out += String(arabic);
      continue;
    }
    out += char;
  }
  return out;
}

/** Convert ASCII digits to Persian digits (for display only). */
export function toPersianDigits(input: string): string {
  return input.replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

/**
 * Separators that may appear inside a phone number copied from anywhere:
 *   • whitespace (including the word joiner and non-breaking variants)
 *   • `-` `_` `.` `(` `)`
 *   • Persian/Arabic punctuation — Arabic comma, thousands and decimal
 *     separators (`۰۹۱۲،۱۲۳` is a very common paste)
 *   • Unicode bidi control and zero-width format marks, which any
 *     Persian text field can inject: ALM, ZWSP, ZWNJ, ZWJ, LRM, RLM,
 *     LRE/RLE/PDF/LRO/RLO, LRI/RLI/FSI/PDI and a stray BOM.
 *
 * These are removed BEFORE validation, so a number pasted out of a
 * Persian document normalizes to exactly the same canonical value as a
 * typed one. Everything that is not one of these — letters, `@`, an
 * extra `+` — is left in place and therefore fails validation.
 */
const SEPARATORS =
  /[\s\u061c\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff\-_.()\u060c\u066b\u066c]/g;

/**
 * Strip the separators above so only the significant characters (digits
 * and a possible leading `+`) remain.
 */
function compact(input: string): string {
  return toAsciiDigits(input).trim().replace(SEPARATORS, "");
}

/**
 * Normalize any accepted Iranian mobile representation into the single
 * canonical `+989XXXXXXXXX` form.
 *
 * Returns `null` when the value is not a valid Iranian mobile number —
 * callers must treat `null` as a hard validation failure.
 */
export function normalizeIranianMobile(input: string): string | null {
  if (typeof input !== "string") return null;

  let value = compact(input);
  if (!value) return null;

  // Drop a leading `00` international prefix (00989... → +989...).
  if (value.startsWith("00")) value = `+${value.slice(2)}`;
  if (value.startsWith("+")) {
    value = value.slice(1);
  }
  if (!/^[0-9]+$/.test(value)) return null;

  // Now only the country-code-local part remains.
  let national: string;
  if (value.startsWith("98")) {
    national = value.slice(2);
  } else if (value.startsWith("0")) {
    national = value.slice(1);
  } else {
    national = value;
  }

  // National significant number for an Iranian mobile is 10 digits
  // and starts with `9`.
  if (!/^9[0-9]{9}$/.test(national)) return null;
  if (!IRAN_MOBILE_PREFIXES.includes(national.slice(0, 3) as (typeof IRAN_MOBILE_PREFIXES)[number])) {
    return null;
  }

  return `+98${national}`;
}

/** Convenience predicate — valid Iranian mobile? */
export function isValidIranianMobile(input: string): boolean {
  return normalizeIranianMobile(input) !== null;
}

/**
 * `+989121234567` → `09121234567` (the shape Iranians read/write).
 * Returns the input untouched when it is not a canonical phone.
 */
export function toNationalDigits(canonical: string): string {
  const normalized = normalizeIranianMobile(canonical);
  if (!normalized) return canonical;
  return `0${normalized.slice(3)}`;
}

/**
 * Human display inside the Persian UI, in Persian digits:
 * `+989121234567` → `۰۹۱۲۱۲۳۴۵۶۷`.
 */
export function formatIranianMobileFa(canonical: string): string {
  return toPersianDigits(toNationalDigits(canonical));
}

/**
 * Privacy-safe rendering for confirmations ("the code was sent to ..."),
 * e.g. `+989121234567` → `۰۹۱۲***۴۵۶۷`.
 * Never log the full number.
 */
export function maskIranianMobileFa(canonical: string): string {
  const national = toNationalDigits(canonical);
  if (national.length !== 11) return toPersianDigits(national);
  return toPersianDigits(`${national.slice(0, 4)}***${national.slice(7)}`);
}
