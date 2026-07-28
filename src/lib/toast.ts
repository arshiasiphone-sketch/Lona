/**
 * Lona — Persian Sonner wrappers.
 *
 * All customer-visible toast strings. Currency references و تومان.
 */
import { toast as sonner } from "sonner";

export const toast = {
  /** Added to bag confirmation. */
  added: (productName: string) =>
    sonner.success("به سبد خرید اضافه شد", {
      description: productName,
      duration: 3500,
    }),
  /** Removed from bag. */
  removed: (productName: string) =>
    sonner("از سبد خرید حذف شد", { description: productName, duration: 3000 }),
  /** Added to wishlist. */
  wished: (productName: string) =>
    sonner.success("به علاقه‌مندی‌ها اضافه شد", {
      description: `${productName} ذخیره شد`,
      duration: 3000,
    }),
  /** Removed from wishlist. */
  unwished: (productName: string) =>
    sonner("از علاقه‌مندی‌ها حذف شد", {
      description: productName,
      duration: 3000,
    }),
  /** Coupon flows. */
  coupon: {
    applied: (code: string, percent: number) =>
      sonner.success("کوپن اعمال شد", {
        description: `${code} · ${percent}٪ تخفیف`,
        duration: 3500,
      }),
    invalid: () =>
      sonner.error("کوپن نامعتبر است", {
        description: "برای اولین سفارش، کد WELCOME10 را امتحان کنید.",
        duration: 3500,
      }),
    removed: () => sonner("کوپن حذف شد", { duration: 2500 }),
  },
  /** Checkout placement. */
  placement: {
    success: (number: string) =>
      sonner.success("سفارش شما ثبت شد", {
        description: `کد سفارش: ${number}. یک یادداشت تشکر برایتان ارسال می‌شود.`,
        duration: 6000,
      }),
    failure: () =>
      sonner.error("پرداخت تکمیل نشد", {
        description: "لطفاً اطلاعات خود را بررسی کنید و دوباره تلاش کنید.",
        duration: 5000,
      }),
  },
  /** Generic copy. */
  copy: (label: string) =>
    sonner.success("کپی شد", { description: label, duration: 2000 }),

  /** Auth. */
  auth: {
    signedIn: () => sonner.success("خوش آمدید", { duration: 3500 }),
    signedOut: () => sonner("با موفقیت خارج شدید", { duration: 2500 }),
    otpSent: () =>
      sonner.success("کد تأیید ارسال شد", {
        description: "ایمیل خود را بررسی کنید.",
        duration: 4000,
      }),
  },
} as const;
