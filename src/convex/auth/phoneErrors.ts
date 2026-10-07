/**
 * LONA — shared phone-auth error codes.
 *
 * These literals are the ONLY thing the server and the browser agree on
 * for authentication failures. Raw Kavenegar payloads, HTTP statuses,
 * stack traces, API keys and OTP tokens never cross the wire; the
 * provider (`convex/auth/phoneOtp.ts`) throws one of these codes and the
 * Persian login UI (`pages/Auth.tsx`) maps it to customer-facing copy.
 *
 * Kept in its own dependency-free module so the browser can import the
 * codes WITHOUT pulling `@convex-dev/auth` or the Convex `_generated`
 * API into the client bundle.
 */

export const PHONE_AUTH_ERRORS = {
  /** The submitted identifier is not a valid Iranian mobile number. */
  invalidPhone: "PHONE_INVALID",
  /**
   * The submitted phone does not own the pending verification code, or is
   * not in canonical `+98…` form.
   */
  phoneMismatch: "PHONE_MISMATCH",
  /** Kavenegar accepted the request but could not deliver it. */
  smsUnavailable: "SMS_UNAVAILABLE",
  /** `KAVENEGAR_API_KEY` / `KAVENEGAR_OTP_TEMPLATE` missing in Convex. */
  smsNotConfigured: "SMS_NOT_CONFIGURED",
  /**
   * The Kavenegar account/template is not usable for OTP yet (Kavenegar
   * 426 — verification service not activated for this account, or 424 —
   * the configured template name does not exist). Both are deployment
   * configuration problems that retrying cannot fix, so the customer is
   * told the SMS service is not ready instead of being asked to retry.
   */
  smsNotReady: "SMS_NOT_READY",
  /** Server-side resend throttle rejected this send. */
  rateLimited: "OTP_RATE_LIMITED",
} as const;

export type PhoneAuthErrorCode =
  (typeof PHONE_AUTH_ERRORS)[keyof typeof PHONE_AUTH_ERRORS];
