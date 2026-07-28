/**
 * Centralized toast helpers wrapping Sonner.
 * Every variant of "added to bag / wishlist / error" lives here so copy stays consistent.
 */
import { toast as sonner } from "sonner";

export const toast = {
  added: (productName: string) =>
    sonner.success("Added to bag", {
      description: productName,
      duration: 3500,
    }),
  removed: (productName: string) =>
    sonner("Removed from bag", { description: productName, duration: 3000 }),
  wished: (productName: string) =>
    sonner.success("Saved", {
      description: `${productName} added to wishlist`,
      duration: 3000,
    }),
  unwished: (productName: string) =>
    sonner("Removed from wishlist", {
      description: productName,
      duration: 3000,
    }),
  coupon: {
    applied: (code: string) =>
      sonner.success("Promo applied", {
        description: `${code} accepted · 10% off`,
        duration: 3500,
      }),
    invalid: () =>
      sonner.error("Promo not recognized", {
        description: "Try WELCOME10 for first orders.",
        duration: 3500,
      }),
    removed: () =>
      sonner("Promo removed", { duration: 2500 }),
  },
  placement: {
    success: (number: string) =>
      sonner.success("Order placed", {
        description: `Confirmation · Order ${number}. A letter is on its way.`,
        duration: 6000,
      }),
    failure: () =>
      sonner.error("Payment couldn't be completed", {
        description: "Please check your details and try again.",
        duration: 5000,
      }),
  },
  copy: (label: string) =>
    sonner.success("Copied", { description: label, duration: 2000 }),
} as const;
