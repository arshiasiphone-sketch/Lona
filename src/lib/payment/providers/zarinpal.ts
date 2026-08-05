/**
 * ZarinpalProvider — frontend adapter for the Zarinpal gateway.
 *
 * The actual gateway calls happen SERVER-SIDE in the Convex
 * `payments` actions (the merchant id must never reach the browser).
 * This class implements the same `PaymentProvider` interface as the
 * mock provider, delegating network work to those actions through the
 * injected `deps`.
 *
 * Flow: `createPayment` → action returns an `authority` + hosted
 * `redirectUrl` → the checkout redirects the browser. The customer
 * returns to `/checkout/callback`, which calls `verifyPayment` — only
 * that server-side verification can mark the order paid.
 */
import type {
  CreatePaymentInput,
  PaymentInit,
  PaymentProvider,
  PaymentStatus,
} from "../index";

export interface ZarinpalProviderDeps {
  request(input: {
    orderId: string;
    callbackUrl: string;
  }): Promise<{ authority: string; redirectUrl: string; expiresAt?: number }>;
  verify(input: {
    orderId: string;
    authority: string;
  }): Promise<{ status: "paid" | "failed"; refId?: string | null }>;
  /**
   * Base origin for the callback URL. Defaults to
   * `window.location.origin` in the browser; injectable for
   * non-browser environments (tests, SSR) so the adapter never
   * touches `window` directly.
   */
  origin?: string;
}

export class ZarinpalProvider implements PaymentProvider {
  readonly name = "zarinpal";

  private readonly deps: ZarinpalProviderDeps;

  constructor(deps: ZarinpalProviderDeps) {
    this.deps = deps;
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentInit> {
    // Path-based (not query) on purpose: Zarinpal appends
    // `?Status=…&Authority=…` to the callback URL, so any query
    // params we add here would collide. The order id rides in the
    // path and the callback page re-derives it from the route.
    const origin =
      this.deps.origin ??
      (typeof window !== "undefined" ? window.location.origin : "");
    const callbackUrl = `${origin}/checkout/callback/${input.orderId}`;
    const result = await this.deps.request({
      orderId: input.orderId,
      callbackUrl,
    });
    return {
      provider: this.name,
      orderId: input.orderId,
      reference: result.authority,
      amountCents: input.amountCents,
      status: "initiated",
      redirectUrl: result.redirectUrl,
      expiresAt: result.expiresAt,
    };
  }

  async verifyPayment(input: {
    reference: string;
    orderId: string;
  }): Promise<"paid" | "failed"> {
    const result = await this.deps.verify({
      orderId: input.orderId,
      authority: input.reference,
    });
    return result.status;
  }

  async getPaymentStatus(input: {
    reference: string;
    orderId: string;
  }): Promise<PaymentStatus> {
    const result = await this.deps.verify({
      orderId: input.orderId,
      authority: input.reference,
    });
    return result.status === "paid" ? "paid" : "failed";
  }

  /**
   * Refund is handled through the admin flow (`orders.refund` +
   * `payments.refundRequest` placeholder for the gateway call) —
   * never invoked from the storefront.
   */
  async refundPayment(): Promise<void> {
    // No-op by design — see refundRequest action.
  }
}
