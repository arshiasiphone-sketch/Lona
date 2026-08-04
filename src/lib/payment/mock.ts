/**
 * MockPaymentProvider — the demo/development gateway.
 *
 * Simulates the full provider lifecycle without a real bank:
 *
 *   createPayment → resolves to `initiated` (as if the user was
 *                   redirected to a hosted gateway)
 *   verifyPayment → resolves `paid` (a successful callback)
 *   getPaymentStatus / refundPayment → consistent bookkeeping
 *
 * Swap this for a real gateway by implementing `PaymentProvider` and
 * registering it in `src/lib/payment/index.ts`.
 */
import type {
  CreatePaymentInput,
  PaymentInit,
  PaymentProvider,
  PaymentStatus,
} from "./index";

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  /** Local in-memory ledger so status/verify/refund stay consistent. */
  private readonly statusByReference = new Map<string, PaymentStatus>();

  async createPayment(input: CreatePaymentInput): Promise<PaymentInit> {
    // Simulated gateway round-trip latency.
    await sleep(450);
    this.statusByReference.set(input.reference, "initiated");
    return {
      provider: this.name,
      orderId: input.orderId,
      reference: input.reference,
      amountCents: input.amountCents,
      status: "initiated",
      expiresAt: input.amountCents > 0 ? Date.now() + 30 * 60 * 1000 : undefined,
    };
  }

  async verifyPayment(input: {
    reference: string;
    orderId: string;
  }): Promise<"paid" | "failed"> {
    await sleep(300);
    const current = this.statusByReference.get(input.reference);
    if (current === "refunded" || current === "cancelled") return "failed";
    this.statusByReference.set(input.reference, "paid");
    return "paid";
  }

  async getPaymentStatus(input: {
    reference: string;
    orderId: string;
  }): Promise<PaymentStatus> {
    return this.statusByReference.get(input.reference) ?? "pending";
  }

  async refundPayment(input: {
    reference: string;
    orderId: string;
    amountCents?: number;
  }): Promise<void> {
    this.statusByReference.set(input.reference, "refunded");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
