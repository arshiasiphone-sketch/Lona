/**
 * Phase 8.2 — Zarinpal payment gateway (server-side).
 *
 * The customer's browser NEVER decides whether a payment succeeded.
 * Only this action, after talking to Zarinpal directly, may flip an
 * order to paid.
 *
 * Flow:
 *   1. FE places the order (`orders.place`) → order is `pending`.
 *   2. FE calls `requestPayment` → we call Zarinpal, get an
 *      `authority`, persist it on the order, return the hosted
 *      redirect URL.
 *   3. Customer pays on Zarinpal → browser returns to
 *      `/checkout/callback?authority=…&orderId=…`.
 *   4. FE calls `verifyPayment` → we verify amount + authority
 *      against Zarinpal and only then confirm / cancel the order.
 *
 * Env (Keys tab):
 *   ZARINPAL_MERCHANT_ID   — merchant id from the Zarinpal dashboard
 *   ZARINPAL_SANDBOX       — "true" routes through the sandbox API
 *
 * If `ZARINPAL_MERCHANT_ID` is missing the checkout gracefully falls
 * back to the MockPaymentProvider (see `status`).
 *
 * NOTE: internal references are accessed through a cast because typed
 * property access on the generated `internal` object from inside an
 * action creates a circular type in this Convex version's codegen.
 * Runtime references are unchanged.
 *
 * Rate limiting readiness: `requestPayment` rejects re-initiations
 * within 30 seconds; for production traffic wrap with a Convex rate
 * limiter (`@convex-dev/rate-limiter`) keyed by user id.
 */
import { v } from "convex/values";
import { action, query } from "./_generated/server";
import { internal } from "./_generated/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const INT = internal as any;

const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID ?? "";
const SANDBOX = process.env.ZARINPAL_SANDBOX === "true";
const API_BASE = SANDBOX
  ? "https://sandbox.zarinpal.com"
  : "https://payment.zarinpal.com";

/** Public gateway readiness — the checkout reads this once. */
export const status = query({
  args: {},
  handler: async () => ({
    configured: Boolean(MERCHANT_ID),
    sandbox: SANDBOX,
    mode: MERCHANT_ID ? "zarinpal" : "mock",
  }),
});

/**
 * Request a Zarinpal payment for a pending order. Returns the hosted
 * redirect URL. Idempotent for an already-initiated order.
 */
export const requestPayment = action({
  args: {
    orderId: v.id("orders"),
    callbackUrl: v.string(),
  },
  handler: async (ctx, { orderId, callbackUrl }) => {
    if (!MERCHANT_ID) throw new Error("ZARINPAL_NOT_CONFIGURED");
    const identity = (await ctx.auth.getUserIdentity()) as {
      subject?: string;
    } | null;
    if (!identity?.subject) throw new Error("UNAUTHORIZED");
    const actor = await ctx.runQuery(INT.orders.getUserById, {
      id: identity.subject as never,
    });
    if (!actor) throw new Error("UNAUTHORIZED");

    const order = await ctx.runQuery(INT.orders.getByIdInternal, { id: orderId });
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.userId !== (identity.subject as never) && actor.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    if (order.status !== "pending") {
      throw new Error(`ORDER_NOT_PENDING:${order.status}`);
    }

    // Duplicate-guard: an initiation already in flight returns the
    // same redirect instead of minting a second authority.
    if (
      (order.paymentStatus === "initiated" || order.paymentStatus === "redirected") &&
      order.paymentReference
    ) {
      const existing = order.paymentReference;
      if (
        order.paymentInitiatedAt &&
        Date.now() - order.paymentInitiatedAt < 30 * 60 * 1000
      ) {
        return {
          authority: existing,
          redirectUrl: `${API_BASE}/pg/StartPay/${existing}`,
          expiresAt: order.paymentExpiresAt ?? Date.now() + 30 * 60 * 1000,
        };
      }
    }

    // Rate-limit readiness: refuse re-initiation within 30 seconds.
    if (
      order.paymentInitiatedAt &&
      Date.now() - order.paymentInitiatedAt < 30_000 &&
      order.paymentStatus === "initiated"
    ) {
      throw new Error("PAYMENT_RATE_LIMITED");
    }

    const now = Date.now();
    const expiresAt = now + 30 * 60 * 1000;
    // Claim the order before the external request. This mutation is
    // the concurrency gate that prevents two authorities being minted
    // for one order by double-clicks or retried actions.
    const requestReference = `REQUEST-${orderId}-${now}`;
    await ctx.runMutation(INT.orders.claimPaymentRequest, {
      orderId,
      requestReference,
      initiatedAt: now,
      expiresAt,
    });

    const body = {
      merchant_id: MERCHANT_ID,
      amount: order.totalCents, // Toman (IRT)
      description: `پرداخت سفارش ${order.number} — بوتیک لونا`,
      callback_url: callbackUrl,
      currency: "IRT",
    };

    const res = await fetch(`${API_BASE}/pg/v4/payment/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as {
      data?: { code?: number; authority?: string; message?: string };
      errors?: Array<{ code?: number; message?: string }>;
    };

    if (json.data?.code !== 100 || !json.data.authority) {
      const err = json.errors?.[0]?.message ?? json.data?.message ?? "UNKNOWN";
      throw new Error(`ZARINPAL_REQUEST_FAILED:${json.data?.code ?? ""}:${err}`);
    }

    const authority = json.data.authority;

    await ctx.runMutation(INT.orders.setPaymentInitiated, {
      orderId,
      provider: "zarinpal",
      reference: authority,
      requestReference,
      initiatedAt: now,
      expiresAt,
    });

    return {
      authority,
      redirectUrl: `${API_BASE}/pg/StartPay/${authority}`,
      expiresAt,
    };
  },
});

/**
 * Verify a payment callback against Zarinpal. Only a `code === 100`
 * response from Zarinpal may mark the order paid; the amount is
 * re-checked against the order's stored total.
 */
export const verifyPayment = action({
  args: {
    orderId: v.id("orders"),
    authority: v.string(),
  },
  handler: async (ctx, { orderId, authority }) => {
    if (!MERCHANT_ID) throw new Error("ZARINPAL_NOT_CONFIGURED");
    const identity = (await ctx.auth.getUserIdentity()) as {
      subject?: string;
    } | null;
    if (!identity?.subject) throw new Error("UNAUTHORIZED");
    const actor = await ctx.runQuery(INT.orders.getUserById, {
      id: identity.subject as never,
    });
    if (!actor) throw new Error("UNAUTHORIZED");

    const order = await ctx.runQuery(INT.orders.getByIdInternal, { id: orderId });
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.userId !== (identity.subject as never) && actor.role !== "admin") {
      throw new Error("FORBIDDEN");
    }
    if (order.paymentReference !== authority) {
      throw new Error("AUTHORITY_MISMATCH");
    }
    if (order.status !== "pending") {
      return { status: order.status === "processing" ? "paid" : "failed" };
    }

    const body = {
      merchant_id: MERCHANT_ID,
      amount: order.totalCents,
      authority,
    };

    const res = await fetch(`${API_BASE}/pg/v4/payment/verify.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as {
      data?: { code?: number; ref_id?: string; message?: string };
      errors?: Array<{ code?: number; message?: string }>;
    };

    // Zarinpal returns 100 for first-time verification and 101 when
    // the same authority was already verified. Both are successful
    // outcomes; the order mutation remains idempotent for retries.
    if ((json.data?.code === 100 || json.data?.code === 101) && json.data.ref_id) {
      // Amount + authority verified by the gateway — finalize.
      await ctx.runMutation(INT.orders.confirmFromPayment, {
        orderId,
        transactionId: json.data.ref_id,
        provider: "zarinpal",
      });
      return { status: "paid", refId: json.data.ref_id };
    }

    // Anything else is a failed/declined/cancelled payment.
    const message =
      json.errors?.[0]?.message ??
      json.data?.message ??
      `GATEWAY_CODE:${json.data?.code ?? ""}`;
    await ctx.runMutation(INT.orders.cancelFromPayment, {
      orderId,
      note: message.slice(0, 200),
    });
    return { status: "failed", refId: null, message };
  },
});

/**
 * Refund request placeholder (admin). The actual reverse flow is
 * `orders.refund` (restock + paymentStatus refunded); Zarinpal's
 * refund API call should be added here once the merchant account
 * enables refunds — the order domain does not need changes.
 */
export const refundRequest = action({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const identity = (await ctx.auth.getUserIdentity()) as {
      subject?: string;
    } | null;
    if (!identity?.subject) throw new Error("UNAUTHORIZED");
    const actor = await ctx.runQuery(INT.orders.getUserById, {
      id: identity.subject as never,
    });
    if (!actor || actor.role !== "admin") throw new Error("FORBIDDEN");

    const order = await ctx.runQuery(INT.orders.getByIdInternal, { id: orderId });
    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.paymentStatus !== "paid" || !order.paymentTransactionId) {
      throw new Error("PAYMENT_NOT_REFUNDABLE");
    }
    // TODO(production): call Zarinpal refund API with the
    // transaction id, then run `orders.refund` on success.
    return { ready: true, transactionId: order.paymentTransactionId };
  },
});
