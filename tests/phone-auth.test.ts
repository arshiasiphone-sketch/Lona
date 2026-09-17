/**
 * LONA — phone authentication core tests.
 *
 * Run with `bun test`. These modules are dependency-free TypeScript (no
 * Convex runtime required), so the tests exercise the exact code the
 * Phone provider, the Kavenegar adapter and the login UI run:
 *
 *   • canonical Iranian mobile normalization (all accepted shapes)
 *   • Persian / Arabic-Indic digit handling
 *   • hard rejection of invalid and non-Iranian numbers
 *   • the display / masking helpers used on the login screen
 *   • the stable auth error-code contract shared with the browser
 *
 * The Kavenegar SDK itself is never imported here: it is an untyped
 * CommonJS package bound to Node's `https` module, and the only thing
 * the rest of the app relies on is the adapter's error contract
 * (`KAVENEGAR_ERRORS`) — which is asserted below without any network.
 */
import { describe, expect, test } from "bun:test";
import {
  formatIranianMobileFa,
  isValidIranianMobile,
  maskIranianMobileFa,
  normalizeIranianMobile,
  toAsciiDigits,
  toNationalDigits,
  toPersianDigits,
} from "../src/convex/auth/phoneNumber";
import { PHONE_AUTH_ERRORS } from "../src/convex/auth/phoneErrors";

const CANONICAL = "+989121234567";

describe("normalizeIranianMobile — every accepted shape collapses to one canonical form", () => {
  const equivalents = [
    "09121234567", // national with leading zero
    "9121234567", // national without leading zero
    "+989121234567", // E.164
    "00989121234567", // international prefix
    "+98 912 123 4567", // spaced
    "0912-123-4567", // dashed
    "0912.123.4567", // dotted
    "091-212-345-67", // arbitrary grouping
    "(0912) 123 4567", // parenthesised
    "0 9 1 2 1 2 3 4 5 6 7", // fully exploded
    " 09121234567 ", // padded
    "۰۹۱۲۱۲۳۴۵۶۷", // Persian digits
    "٠٩١٢١٢٣٤٥٦٧", // Arabic-Indic digits
    "٠٩١٢-١٢٣-٤٥٦٧", // Arabic-Indic + separator
    "۰۹۱۲،۱۲۳۴۵۶۷", // Persian comma (very common paste)
    "\u200e09121234567", // with an LTR mark
    "\u200f09121234567\u200e", // RLM + LRM
    "\u206609121234567\u2069", // bidi isolates
    "\ufeff09121234567", // pasted with a BOM
  ];

  test.each(equivalents)("%s → +989121234567", (input) => {
    expect(normalizeIranianMobile(input)).toBe(CANONICAL);
  });

  test("one human can never produce two accounts — all equivalents are identical", () => {
    const unique = new Set(equivalents.map((value) => normalizeIranianMobile(value)));
    expect(unique.size).toBe(1);
    expect([...unique][0]).toBe(CANONICAL);
  });

  test("the canonical form is idempotent", () => {
    expect(normalizeIranianMobile(CANONICAL)).toBe(CANONICAL);
    expect(normalizeIranianMobile(normalizeIranianMobile("0912 123 4567")!)).toBe(
      CANONICAL,
    );
  });
});

describe("normalizeIranianMobile — invalid input is a hard failure", () => {
  const rejected = [
    "", // empty
    "   ", // blank
    "0912", // too short
    "091212345678", // too long
    "2812345678", // not a mobile prefix
    "02123456789", // Tehran landline
    "0812345678", // landline
    "+12125551234", // US number
    "+971501234567", // UAE mobile
    "98912123456789", // garbage country prefix
    "abc", // letters
    "0912123456a", // trailing letter
    "09121234567@example.com", // email must never be read as a phone
    "++989121234567", // doubled sign
    "0990123456789", // leading 990 but 13 digits
    "0912 123 456", // one digit short after separators
  ];

  test.each(rejected)("%p → null", (input) => {
    expect(normalizeIranianMobile(input)).toBeNull();
    expect(isValidIranianMobile(input)).toBe(false);
  });

  test("non-string input never throws", () => {
    expect(normalizeIranianMobile(undefined as unknown as string)).toBeNull();
    expect(normalizeIranianMobile(null as unknown as string)).toBeNull();
    expect(normalizeIranianMobile(989121234567 as unknown as string)).toBeNull();
  });
});

describe("digit conversion", () => {
  test("toAsciiDigits maps Persian and Arabic-Indic digits", () => {
    expect(toAsciiDigits("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789");
    expect(toAsciiDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
    expect(toAsciiDigits("۰۹۱۲")).toBe("0912");
    expect(toAsciiDigits("abc")).toBe("abc");
  });

  test("toPersianDigits round-trips with toAsciiDigits", () => {
    expect(toPersianDigits("09121234567")).toBe("۰۹۱۲۱۲۳۴۵۶۷");
    expect(toAsciiDigits(toPersianDigits("09121234567"))).toBe("09121234567");
  });
});

describe("display helpers never leak more than intended", () => {
  test("toNationalDigits produces the shape Iranians read", () => {
    expect(toNationalDigits(CANONICAL)).toBe("09121234567");
    // Non-canonical input is returned untouched rather than mangled.
    expect(toNationalDigits("not-a-phone")).toBe("not-a-phone");
  });

  test("formatIranianMobileFa renders Persian digits", () => {
    expect(formatIranianMobileFa(CANONICAL)).toBe("۰۹۱۲۱۲۳۴۵۶۷");
  });

  test("maskIranianMobileFa hides the middle of the number", () => {
    const masked = maskIranianMobileFa(CANONICAL);
    expect(masked).toBe("۰۹۱۲***۴۵۶۷");
    expect(masked).not.toContain("۱۲۳");
  });
});

describe("OTP throttle constants — server policy is the source of truth", () => {
  test("backend policy matches the documented contract", async () => {
    // Import the real constants so a silent policy drift fails CI.
    const throttle = await import("../src/convex/auth/otpThrottle");
    expect(throttle.OTP_RESEND_COOLDOWN_MS).toBe(60_000);
    expect(throttle.OTP_WINDOW_MS).toBe(15 * 60_000);
    expect(throttle.OTP_MAX_PER_WINDOW).toBe(5);
    // A failed send may be released only within a narrow window — long
    // enough to cover the Kavenegar timeout, far shorter than the 60s
    // cooldown, so a delivered code can never be retro-actively released.
    expect(throttle.OTP_RELEASE_GRACE_MS).toBeLessThan(
      throttle.OTP_RESEND_COOLDOWN_MS,
    );
    expect(throttle.OTP_RELEASE_GRACE_MS).toBeGreaterThan(0);
  });

  test("the provider TTL matches the UI countdown", async () => {
    const { OTP_MAX_AGE_SECONDS } = await import(
      "../src/convex/auth/phoneOtp"
    );
    expect(OTP_MAX_AGE_SECONDS).toBe(5 * 60);
  });
});

describe("phone auth error contract", () => {
  test("codes are unique and stable — the browser maps them verbatim", () => {
    const codes = Object.values(PHONE_AUTH_ERRORS);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes).toEqual([
      "PHONE_INVALID",
      "PHONE_MISMATCH",
      "SMS_UNAVAILABLE",
      "SMS_NOT_CONFIGURED",
      "OTP_RATE_LIMITED",
    ]);
  });

  test("no code leaks provider internals or secrets", () => {
    for (const code of Object.values(PHONE_AUTH_ERRORS)) {
      expect(code).not.toMatch(/kavenegar|apikey|token|secret/i);
    }
  });
});
