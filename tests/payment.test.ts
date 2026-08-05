/**
 * Phase 8.3 — automated tests for the payment + money core.
 *
 * Run with `bun test`. These modules are pure TypeScript (no Convex
 * runtime required), so they exercise the exact code the checkout
 * runs:
 *   • MockPaymentProvider lifecycle + idempotent verify
 *   • ZarinpalProvider adapter (callback URL shape, delegation)
 *   • Provider registry fallback behaviour
 *   • Money arithmetic invariants behind price recalculation
 */
import { describe, expect, test } from "bun:test";
import { MockPaymentProvider } from "../src/lib/payment/mock";
import { ZarinpalProvider } from "../src/lib/payment/providers/zarinpal";
import { getPaymentProvider, registerPaymentProvider } from "../src/lib/payment/index";
import {
  clampToZero,
  formatPrice,
  grandTotal,
  percentOf,
} from "../src/lib/money";

describe("MockPaymentProvider", () => {
  test("createPayment returns initiated with the given reference", async () => {
    const p = new MockPaymentProvider();
    const init = await p.createPayment({
      orderId: "o1",
      reference: "PAY-TEST",
      amountCents: 2_480_000,
    });
    expect(init.status).toBe("initiated");
    expect(init.reference).toBe("PAY-TEST");
    expect(init.orderId).toBe("o1");
    expect(init.expiresAt).toBeGreaterThan(Date.now());
  });

  test("verifyPayment resolves paid and stays idempotent on double callback", async () => {
    const p = new MockPaymentProvider();
    await p.createPayment({
      orderId: "o1",
      reference: "PAY-DOUBLE",
      amountCents: 1000,
    });
    expect(await p.verifyPayment({ reference: "PAY-DOUBLE", orderId: "o1" })).toBe(
      "paid",
    );
    // Double callback — second verification must also report paid and
    // never throw, mirroring the server-side idempotent finalize.
    expect(await p.verifyPayment({ reference: "PAY-DOUBLE", orderId: "o1" })).toBe(
      "paid",
    );
    expect(await p.getPaymentStatus({ reference: "PAY-DOUBLE", orderId: "o1" })).toBe(
      "paid",
    );
  });

  test("refund flips status and subsequent verify fails", async () => {
    const p = new MockPaymentProvider();
    await p.createPayment({
      orderId: "o1",
      reference: "PAY-REFUND",
      amountCents: 1000,
    });
    await p.refundPayment({ reference: "PAY-REFUND", orderId: "o1" });
    expect(
      await p.getPaymentStatus({ reference: "PAY-REFUND", orderId: "o1" }),
    ).toBe("refunded");
    expect(
      await p.verifyPayment({ reference: "PAY-REFUND", orderId: "o1" }),
    ).toBe("failed");
  });
});

describe("ZarinpalProvider adapter", () => {
  test("createPayment uses a path-based callback with the order id", async () => {
    let seen: { orderId: string; callbackUrl: string } | null = null;
    const p = new ZarinpalProvider({
      origin: "https://lona.shop",
      request: async (input) => {
        seen = input;
        return { authority: "AUTH-123", redirectUrl: "https://zarinpal/pay" };
      },
      verify: async () => ({ status: "paid" as const }),
    });
    const init = await p.createPayment({
      orderId: "order_abc",
      reference: "PAY-1",
      amountCents: 5000,
    });
    expect(init.reference).toBe("AUTH-123");
    expect(init.status).toBe("initiated");
    expect(init.redirectUrl).toBe("https://zarinpal/pay");
    // Order id must ride in the path (Zarinpal appends ?Status=… to the
    // callback URL, so query params would collide).
    expect(seen?.callbackUrl).toContain("/checkout/callback/order_abc");
  });

  test("verifyPayment delegates to the injected deps.verify", async () => {
    let seen: { orderId: string; authority: string } | null = null;
    const p = new ZarinpalProvider({
      request: async () => ({
        authority: "AUTH-X",
        redirectUrl: "https://zarinpal/pay",
      }),
      verify: async (input) => {
        seen = input;
        return { status: "failed" as const };
      },
    });
    const verdict = await p.verifyPayment({
      reference: "AUTH-X",
      orderId: "order_1",
    });
    expect(verdict).toBe("failed");
    expect(seen?.authority).toBe("AUTH-X");
    expect(seen?.orderId).toBe("order_1");
  });

  test("refundPayment is a no-op by design", async () => {
    const p = new ZarinpalProvider({
      request: async () => ({ authority: "A", redirectUrl: "u" }),
      verify: async () => ({ status: "paid" as const }),
    });
    await expect(
      p.refundPayment({ reference: "A", orderId: "o1" }),
    ).resolves.toBeUndefined();
  });
});

describe("Payment provider registry", () => {
  test("mock is registered by default", () => {
    expect(getPaymentProvider("mock").name).toBe("mock");
  });

  test("unknown names fall back to the mock provider", () => {
    expect(getPaymentProvider("idpay").name).toBe("mock");
  });

  test("registerPaymentProvider makes a custom provider resolvable", () => {
    class Fake implements import("../src/lib/payment/index").PaymentProvider {
      readonly name = "fake";
      async createPayment(input: import("../src/lib/payment/index").CreatePaymentInput) {
        return {
          provider: this.name,
          orderId: input.orderId,
          reference: input.reference,
          amountCents: input.amountCents,
          status: "initiated" as const,
        };
      }
      async verifyPayment() {
        return "paid" as const;
      }
      async getPaymentStatus() {
        return "pending" as const;
      }
      async refundPayment() {}
    }
    registerPaymentProvider("fake", () => new Fake());
    expect(getPaymentProvider("fake").name).toBe("fake");
  });
});

describe("Money arithmetic (price recalculation invariants)", () => {
  test("percentOf clamps the rate to [0, 1]", () => {
    expect(percentOf(1_000_000, 0.15)).toBe(150_000);
    expect(percentOf(1_000_000, 2)).toBe(1_000_000);
    expect(percentOf(1_000_000, -0.5)).toBe(0);
  });

  test("grandTotal never goes negative", () => {
    expect(grandTotal({ subtotal: 1000, discount: 5000, shipping: 0 })).toBe(0);
    expect(
      grandTotal({ subtotal: 1000, discount: 200, shipping: 300 }),
    ).toBe(1100);
    expect(grandTotal({ subtotal: 1000, discount: 0, shipping: 0, tax: 90 })).toBe(
      1090,
    );
  });

  test("formatPrice renders Persian Toman", () => {
    expect(formatPrice(2_480_000)).toBe("۲٬۴۸۰٬۰۰۰ تومان");
    expect(clampToZero(-5)).toBe(0);
  });
});
