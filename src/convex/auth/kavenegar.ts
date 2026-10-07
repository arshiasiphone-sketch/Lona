"use node";

/**
 * LONA — Kavenegar SMS adapter (OTP transport only).
 *
 * ── Responsibility boundary ───────────────────────────────────────────
 * Kavenegar is ONLY the SMS delivery channel. It never verifies codes.
 * Convex Auth owns verification state, sessions and account creation;
 * this file merely hands the Convex-Auth-generated token to Kavenegar's
 * `VerifyLookup` (template) endpoint.
 *
 * ── Why an internal action behind `"use node"` ────────────────────────
 * The official `kavenegar` SDK is a CommonJS package built on Node's
 * `https` + `querystring` built-ins, so it can only execute in Convex's
 * Node.js runtime. Convex does not allow a V8 module to import a Node
 * module, therefore the provider (`src/convex/auth/phoneOtp.ts`, V8)
 * reaches this action through `ctx.runAction(...)` — the supported
 * cross-runtime bridge.
 *
 * ── Secret handling ───────────────────────────────────────────────────
 * `KAVENEGAR_API_KEY` and `KAVENEGAR_OTP_TEMPLATE` are read from the
 * Convex deployment environment only. They are never exposed through
 * `VITE_*`, never bundled into the browser, and never logged. The OTP
 * token is never logged either.
 */

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
// The published SDK (`kavenegar@1.1.4`, last released 2018) ships no type
// declarations, and no `@types/kavenegar` exists on npm. An ambient
// `declare module` block is not picked up by Convex's isolated `tsc`
// pass over the `convex/` directory, so the import is suppressed here and
// the — very small — surface actually used is typed explicitly below.
// Nothing else in this file degrades to `any`.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- untyped CommonJS SDK (see note above).
import { KavenegarApi } from "kavenegar";
import { normalizeIranianMobile, toNationalDigits } from "./phoneNumber";

/** Response row returned by Kavenegar (only the fields we may touch). */
interface KavenegarEntry {
  messageid?: number;
  message?: string;
  status?: number;
  statustext?: string;
  receptor?: string;
}

type KavenegarCallback = (
  entries: KavenegarEntry[] | string,
  status?: number,
  message?: string,
) => void;

interface KavenegarClient {
  VerifyLookup(data: Record<string, string>, callback: KavenegarCallback): void;
}

type KavenegarFactory = (options: { apikey: string }) => KavenegarClient;

const KAVENEGAR_TIMEOUT_MS = 15_000;

/** Stable, non-sensitive error codes surfaced to the auth layer. */
export const KAVENEGAR_ERRORS = {
  notConfigured: "KAVENEGAR_NOT_CONFIGURED",
  invalidRecipient: "KAVENEGAR_INVALID_RECIPIENT",
  /**
   * Kavenegar 426 — «استفاده از این متد نیازمند سرویس پیشرفته می باشد»:
   * the account may not call `verify/lookup` at all yet. This is an
   * account setting on Kavenegar's side (activating the verification /
   * advanced service for this API key); no code change can work around
   * it, so it is reported as its own cause instead of a generic failure.
   */
  serviceNotEnabled: "KAVENEGAR_SERVICE_NOT_ENABLED",
  /**
   * Kavenegar 424 — «الگوی مورد نظر پیدا نشد»: the configured template
   * does not exist (or its pattern is not approved yet).
   * `KAVENEGAR_OTP_TEMPLATE` must hold the template NAME exactly as the
   * Kavenegar panel spells it, not an internal numeric id.
   */
  templateNotFound: "KAVENEGAR_TEMPLATE_NOT_FOUND",
  rejected: "KAVENEGAR_REJECTED",
  unreachable: "KAVENEGAR_UNREACHABLE",
} as const;

export type KavenegarErrorCode =
  (typeof KAVENEGAR_ERRORS)[keyof typeof KAVENEGAR_ERRORS];

/**
 * Thrown for every failure path so callers can map a safe Persian message.
 *
 * `code` is ALSO embedded in the message on purpose: Convex carries a
 * thrown error across the V8 ← Node runtime hop by message (and stack)
 * only, so a custom property would not survive `ctx.runAction(...)`. The
 * property is kept as well for in-process callers and tests.
 */
export class KavenegarError extends Error {
  readonly code: KavenegarErrorCode;
  /** Kavenegar's numeric `return.status`, when the call reached them. */
  readonly status?: number;

  constructor(code: KavenegarErrorCode, status?: number) {
    super(status === undefined ? code : `${code} (Kavenegar status ${status})`);
    this.name = "KavenegarError";
    this.code = code;
    this.status = status;
  }
}

/**
 * Translate Kavenegar's `return.status` into a stable adapter code.
 *
 * Only the causes the login flow can act on are distinguished; everything
 * else collapses into `rejected` so the contract stays small. Statuses
 * come from Kavenegar's documented table:
 *   411 invalid receptor · 424 template not found · 426 advanced service
 *   required · 401/403 account inactive / wrong API key · 418 no credit.
 */
function codeForStatus(status: number): KavenegarErrorCode {
  switch (status) {
    case 426:
      return KAVENEGAR_ERRORS.serviceNotEnabled;
    case 424:
      return KAVENEGAR_ERRORS.templateNotFound;
    case 411:
      return KAVENEGAR_ERRORS.invalidRecipient;
    default:
      return KAVENEGAR_ERRORS.rejected;
  }
}

/**
 * Wrap the SDK's callback API in a deterministic promise with a hard
 * timeout. The SDK signals a transport failure by invoking the callback
 * with only the first argument, so `status` stays `undefined` there.
 */
function verifyLookup(
  apiKey: string,
  params: { receptor: string; token: string; template: string },
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new KavenegarError(KAVENEGAR_ERRORS.unreachable));
    }, KAVENEGAR_TIMEOUT_MS);

    const finish = (error: KavenegarError | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    };

    try {
      const api = (KavenegarApi as unknown as KavenegarFactory)({
        apikey: apiKey,
      });
      api.VerifyLookup(params, (_entries, status, message) => {
        if (status === 200) {
          // Transport accepted by Kavenegar. This is NOT authentication
          // success — Convex Auth still has to verify the user's code.
          finish(null);
          return;
        }
        // `message` is a Kavenegar provider string; it is intentionally
        // not surfaced to end users (see the auth error map).
        void message;
        finish(
          new KavenegarError(
            status === undefined
              ? KAVENEGAR_ERRORS.unreachable
              : codeForStatus(status),
            status,
          ),
        );
      });
    } catch {
      finish(new KavenegarError(KAVENEGAR_ERRORS.unreachable));
    }
  });
}

/**
 * Send the Convex-Auth-generated verification code through Kavenegar's
 * `VerifyLookup` template endpoint.
 *
 * Internal by design: only the auth provider may call it, and it always
 * validates/normalizes the recipient itself so a caller can never push
 * an arbitrary number into the SMS channel.
 */
export const sendOtp = internalAction({
  args: {
    phone: v.string(),
    token: v.string(),
  },
  handler: async (_ctx, { phone, token }): Promise<{ ok: true }> => {
    const apiKey = process.env.KAVENEGAR_API_KEY;
    const template = process.env.KAVENEGAR_OTP_TEMPLATE;

    if (!apiKey || !template) {
      throw new KavenegarError(KAVENEGAR_ERRORS.notConfigured);
    }

    const canonical = normalizeIranianMobile(phone);
    if (!canonical) {
      throw new KavenegarError(KAVENEGAR_ERRORS.invalidRecipient);
    }

    await verifyLookup(apiKey, {
      // Kavenegar expects the national form (09XXXXXXXXX) as `receptor`.
      receptor: toNationalDigits(canonical),
      token,
      template,
    });

    return { ok: true };
  },
});
