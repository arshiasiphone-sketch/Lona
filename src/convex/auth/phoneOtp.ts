/**
 * LONA — Convex Auth Phone (SMS OTP) provider.
 *
 * Convex Auth remains the authentication authority: it generates the
 * one-time code, stores its hash, enforces expiry and the
 * phone-must-match rule, creates/links the account and mints the
 * session. Kavenegar is used purely as the SMS transport.
 *
 * Flow
 * ────
 *   phone (client input)
 *                     → `normalizeIdentifier` (server) → canonical +98…
 *                     → Convex Auth creates the 6-digit code
 *                     → `sendVerificationRequest` → server throttle
 *                                                → Kavenegar VerifyLookup
 *                     → user submits the code
 *                     → Convex Auth verifies it (`authorize` re-checks
 *                       that the submitted phone owns that code)
 *                     → session
 *
 * The provider is registered with the library's default id, `phone`, in
 * `src/convex/auth.ts`. Existing `authAccounts` rows are keyed by
 * `(provider, providerAccountId)` with a canonical `+98…` phone as the
 * account id, so the same human can never produce two accounts.
 */

import { Phone } from "@convex-dev/auth/providers/Phone";
import { internal } from "../_generated/api";
import { normalizeIranianMobile } from "./phoneNumber";
import { PHONE_AUTH_ERRORS } from "./phoneErrors";

/**
 * Codes live for five minutes. Short lifetime + Kavenegar's own per-number
 * throttling keeps brute force impractical for a 6-digit code.
 */
export const OTP_MAX_AGE_SECONDS = 60 * 5;

/** Cryptographically secure 6-digit code (no Math.random). */
function generateSixDigitCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const value =
    ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return String(value % 1_000_000).padStart(6, "0");
}

export const phoneOtp = Phone({
  // Default provider id (`phone`) is kept deliberately: it is the
  // library convention and keeps `authAccounts.provider` stable.
  maxAge: OTP_MAX_AGE_SECONDS,

  /**
   * Runs first, on the server, for both the send and the verify call.
   *
   * This is the single normalization choke point: whatever the browser
   * submits (Persian digits, `0912…`, `0098…`, spaced input) becomes the
   * canonical `+98…` value that is stored as `providerAccountId` and sent
   * to Kavenegar. Invalid input throws before a code is created, so an
   * unusable identifier never reaches the SMS quota or the throttle table.
   */
  normalizeIdentifier: (identifier: string) => {
    const phone = normalizeIranianMobile(identifier);
    if (!phone) throw new Error(PHONE_AUTH_ERRORS.invalidPhone);
    return phone;
  },

  generateVerificationToken: async () => generateSixDigitCode(),

  /**
   * Runs before the submitted code is accepted. Convex Auth already
   * guarantees "no code without a code request", so the remaining job is
   * to prove the submitted phone owns the pending code.
   *
   * `normalizeIdentifier` has already canonicalized both the submitted
   * `phone` and the stored `providerAccountId`, so this is a strict
   * equality check between two canonical values. A code requested for one
   * number therefore cannot be redeemed for another, and because the
   * 6-digit token is shorter than the library's 24-character
   * self-contained threshold, the `phone` argument is mandatory — a bare
   * token is never sufficient on its own.
   */
  authorize: async (params, account) => {
    const raw = params.phone;
    if (typeof raw !== "string") {
      throw new Error(PHONE_AUTH_ERRORS.invalidPhone);
    }
    const phone = normalizeIranianMobile(raw);
    if (!phone || phone !== account.providerAccountId) {
      throw new Error(PHONE_AUTH_ERRORS.phoneMismatch);
    }
  },

  /**
   * Sends the code. Validation happens again here (the frontend's
   * normalization is never trusted) and the actual SMS call is delegated
   * to the isolated Node-runtime Kavenegar adapter.
   */
  sendVerificationRequest: async ({ identifier, token }, ctx) => {
    const phone = normalizeIranianMobile(identifier);
    if (!phone) {
      throw new Error(PHONE_AUTH_ERRORS.invalidPhone);
    }

    // Authoritative resend throttle — runs before any SMS is queued, so a
    // client that ignores the UI countdown still cannot spam a number.
    try {
      await ctx.runMutation(internal.auth.otpThrottle.claim, { phone });
    } catch (error) {
      if (String((error as Error | null)?.message ?? "").includes("OTP_RATE_LIMITED")) {
        throw new Error(PHONE_AUTH_ERRORS.rateLimited);
      }
      throw new Error(PHONE_AUTH_ERRORS.smsUnavailable);
    }

    try {
      // `ctx.runAction` is the supported cross-runtime bridge: this
      // provider runs in Convex's V8 runtime while the Kavenegar SDK
      // (Node built-ins) must run in the Node.js runtime.
      await ctx.runAction(internal.auth.kavenegar.sendOtp, {
        phone,
        token,
      });
    } catch (error) {
      // A claim whose send never produced an SMS must not count against
      // the number's quota, and the user must not be stuck behind the
      // 60-second cooldown for a message they never received. The release
      // window is intentionally narrow and only removes THIS send's claim,
      // so a genuinely delivered code is never undone.
      await ctx
        .runMutation(internal.auth.otpThrottle.release, { phone })
        .catch(() => {
          // Releasing is a courtesy — never mask the real failure.
        });

      // Map every transport/configuration failure to a controlled,
      // secret-free error. Nothing about the API key, the template, the
      // token or the provider payload leaves the server.
      const code = (error as { code?: string } | null)?.code;
      if (code === "KAVENEGAR_NOT_CONFIGURED") {
        throw new Error(PHONE_AUTH_ERRORS.smsNotConfigured);
      }
      throw new Error(PHONE_AUTH_ERRORS.smsUnavailable);
    }
  },
});
