/**
 * Lona — payment provider abstraction (Phase 8.1).
 *
 * The commerce core (Convex `orders`) never talks to a gateway
 * directly: it only records `paymentStatus` / `paymentReference` on
 * the order. This layer is the seam where real Iranian gateways
 * (Zarinpal, IDPay, etc.) plug in later.
 *
 *   createPayment()    → initiate a payment for a pending order
 *   verifyPayment()    → confirm the gateway callback
 *   getPaymentStatus() → poll a payment
 *   refundPayment()    → reverse a paid payment
 *
 * Today the only registered provider is the MockPaymentProvider used
 * by the demo checkout. Adding a real gateway = implement the
 * interface + `registerPaymentProvider(...)` — no changes to the
 * order domain or checkout UI.
 */
import { MockPaymentProvider } from "./mock";

export type PaymentStatus =
  | "pending"
  | "initiated"
  | "redirected"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export interface PaymentInit {
  provider: string;
  orderId: string;
  reference: string;
  amountCents: number;
  status: PaymentStatus;
  /** Future gateways return a hosted payment URL here. */
  redirectUrl?: string;
  /** When the payment window closes (reservation expiry). */
  expiresAt?: number;
}

export interface PaymentCustomer {
  fullName?: string;
  email?: string;
  phone?: string;
}

export interface CreatePaymentInput {
  orderId: string;
  reference: string;
  amountCents: number;
  description?: string;
  customer?: PaymentCustomer;
}

export interface PaymentProvider {
  readonly name: string;
  createPayment(input: CreatePaymentInput): Promise<PaymentInit>;
  verifyPayment(input: {
    reference: string;
    orderId: string;
  }): Promise<"paid" | "failed">;
  getPaymentStatus(input: {
    reference: string;
    orderId: string;
  }): Promise<PaymentStatus>;
  refundPayment(input: {
    reference: string;
    orderId: string;
    amountCents?: number;
  }): Promise<void>;
}

/* Provider registry ------------------------------------------------ */

const registry = new Map<string, () => PaymentProvider>();

/** Register a provider factory (mock is registered by default). */
export function registerPaymentProvider(
  name: string,
  factory: () => PaymentProvider
): void {
  registry.set(name, factory);
}

registerPaymentProvider("mock", () => new MockPaymentProvider());

/**
 * Resolve a provider by name; falls back to the mock provider so the
 * app never breaks when a gateway isn't configured yet.
 */
export function getPaymentProvider(name: string = "mock"): PaymentProvider {
  const factory = registry.get(name);
  return factory ? factory() : new MockPaymentProvider();
}
