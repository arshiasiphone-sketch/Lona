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
  rejected: "KAVENEGAR_REJECTED",
  unreachable: "KAVENEGAR_UNREACHABLE",
} as const;

export type KavenegarErrorCode =
  (typeof KAVENEGAR_ERRORS)[keyof typeof KAVENEGAR_ERRORS];

/** Thrown for every failure path so callers can map a safe Persian message. */
export class KavenegarError extends Error {
  readonly code: KavenegarErrorCode;

  constructor(code: KavenegarErrorCode) {
    super(code);
    this.name = "KavenegarError";
    this.code = code;
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
              : KAVENEGAR_ERRORS.rejected,
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
