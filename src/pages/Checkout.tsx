import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Lock,
  MapPin,
  CreditCard,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  X,
  Timer,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useCoupon } from "@/hooks/use-coupon";
import { useProducts, type Product } from "@/lib/data/catalog";
import { useDeviceSession } from "@/lib/data/session";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { formatPrice } from "@/lib/money";
import { toast } from "@/lib/toast";
import { getPaymentProvider } from "@/lib/payment";
import { ZarinpalProvider } from "@/lib/payment/providers/zarinpal";

const STEPS = ["اطلاعات تماس", "ارسال", "پرداخت"] as const;

type PaymentPhase = "connecting" | "gateway" | "processing";

interface PendingPayment {
  orderId: string;
  number: string;
  reference: string;
  amountCents: number;
  expiresAt?: number;
}

interface FieldErrors {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  postal?: string;
  country?: string;
  card?: string;
  expiry?: string;
  cvc?: string;
}

interface ShippingOption {
  code: string;
  name: string;
  priceCents: number;
  estimatedDays: number;
}

const FALLBACK_SHIPPING: ShippingOption[] = [
  { code: "standard", name: "ارسال عادی", priceCents: 120000, estimatedDays: 7 },
  { code: "express", name: "ارسال سریع", priceCents: 250000, estimatedDays: 3 },
  { code: "white_glove", name: "پیک شهری", priceCents: 650000, estimatedDays: 1 },
];

const silhouetteFor = (cat: string) => {
  switch (cat) {
    case "intimates-bras": return "bra" as const;
    case "intimates-briefs": return "brief" as const;
    case "sleepwear": return "robe" as const;
    case "homewear": return "tee" as const;
    case "bodysuits": return "bodysuit" as const;
    case "shapewear": return "bodysuit" as const;
    case "loungewear-sets": return "robe" as const;
    default: return "accessory" as const;
  }
};

export default function Checkout() {
  const { lines, clear } = useCart();
  const coupon = useCoupon();
  const { applied } = coupon;
  const sessionId = useDeviceSession();
  const placeOrderMut = useMutation(api.orders.place);
  const confirmPaymentMut = useMutation(api.orders.confirmPayment);
  const cancelPendingMut = useMutation(api.orders.cancelPending);
  const setCartMeta = useMutation(api.cart.setMeta);
  const requestZarinpal = useAction(api.payments.requestPayment);
  // Phase 8.2: gateway readiness — zarinpal when the merchant id is
  // configured server-side, otherwise the mock provider.
  const payStatus = useQuery(api.payments.status, {});

  // Phase 7.5: prices must mirror Convex, not the static catalog.
  const liveProducts = useProducts();
  const cartRow = useQuery(api.cart.getMine, sessionId ? { sessionId } : "skip");
  // Phase 8.1: live shipping methods from the admin-managed table.
  const liveShipping = useQuery(api.shipping.listActive, {});

  const shippingOptions = useMemo<ShippingOption[]>(() => {
    if (liveShipping && liveShipping.length > 0) {
      return liveShipping.map((m) => ({
        code: m.code,
        name: m.name,
        priceCents: m.priceCents,
        estimatedDays: m.estimatedDays,
      }));
    }
    return FALLBACK_SHIPPING;
  }, [liveShipping]);

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [placed, setPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [shippingMethod, setShippingMethod] = useState<string>("express");
  const [couponRestored, setCouponRestored] = useState(false);

  // ── Phase 8.1: pending payment state machine ─────────────────
  const [pending, setPending] = useState<PendingPayment | null>(null);
  const [paymentPhase, setPaymentPhase] = useState<PaymentPhase>("connecting");
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const connectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (connectTimer.current) clearTimeout(connectTimer.current);
    };
  }, []);

  // Restore a coupon that was applied on the Cart page (persisted via
  // `cart.setMeta`). Without this the discount silently disappears.
  useEffect(() => {
    if (couponRestored || applied) return;
    const code = cartRow?.couponCode;
    if (!code) return;
    coupon.apply(code);
    setCouponRestored(true);
  }, [cartRow?.couponCode, applied, couponRestored, coupon]);

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    (liveProducts ?? []).forEach((p) => m.set(p.slug, p));
    return m;
  }, [liveProducts]);

  const items = lines
    .map((l) => ({ ...l, product: productMap.get(l.productId) }))
    .filter((x): x is NonNullable<typeof x> => Boolean(x.product));

  const subtotal = items.reduce(
    (s, i) => s + (i.product?.price ?? 0) * i.quantity,
    0
  );
  const discount = applied ? subtotal * applied.percentOff : 0;
  const shippingOption =
    shippingOptions.find((o) => o.code === shippingMethod) ?? shippingOptions[1];
  const shippingPrice = shippingOption?.priceCents ?? 0;
  const total = subtotal - discount + shippingPrice;

  const [form, setForm] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postal: "",
    country: "ایران",
    card: "",
    expiry: "",
    cvc: "",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const validateStep = useMemo(
    () => (s: number): FieldErrors => {
      const errs: FieldErrors = {};
      const req = (val: string) => val.trim().length > 0;
      if (s === 0) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "ایمیل معتبر وارد کنید.";
        if (form.phone && !/^[+]?[\d\s()-]{7,}$/.test(form.phone)) errs.phone = "شماره تلفن را بررسی کنید.";
      }
      if (s === 1) {
        if (!req(form.firstName)) errs.firstName = "الزامی";
        if (!req(form.lastName)) errs.lastName = "الزامی";
        if (!req(form.address)) errs.address = "الزامی";
        if (!req(form.city)) errs.city = "الزامی";
        if (!req(form.postal)) errs.postal = "الزامی";
      }
      if (s === 2) {
        const digits = form.card.replace(/\s+/g, "");
        if (digits.length < 13 || digits.length > 19) errs.card = "شماره کارت معتبر وارد کنید.";
        if (!/^\d{2}\/\d{2}$/.test(form.expiry)) errs.expiry = "فرمت MM/YY.";
        if (!/^\d{3,4}$/.test(form.cvc.trim())) errs.cvc = "کد امنیتی را وارد کنید.";
      }
      return errs;
    },
    [form]
  );

  useEffect(() => {
    setErrors({});
  }, [step]);

  if (items.length === 0 && !placed) {
    return (
      <div className="mx-auto max-w-3xl px-6 pt-32 pb-24 text-center lg:px-10">
        <p className="type-eyebrow text-ink-muted">پرداخت</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-6xl">
          سبد خرید شما خالی است.
        </h1>
        <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-ink-soft">
          ابتدا محصولی به سبد خرید اضافه کنید.
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          مشاهده کالکسیون
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  /* ── Phase 8.1 payment flow ─────────────────────────────────── */

  const startPayment = async (result: {
    orderId: string;
    number: string;
    paymentReference: string;
    totalCents: number;
    paymentExpiresAt?: number;
  }) => {
    const orderId = result.orderId as Id<"orders">;
    setPending({
      orderId,
      number: result.number,
      reference: result.paymentReference,
      amountCents: result.totalCents,
      expiresAt: result.paymentExpiresAt,
    });
    setGatewayError(null);
    setPaymentPhase("connecting");

    // ── Phase 8.2: real gateway redirect ──────────────────────
    if (payStatus?.mode === "zarinpal") {
      try {
        const provider = new ZarinpalProvider({
          request: async ({ orderId: oid, callbackUrl }) => {
            const r = await requestZarinpal({
              orderId: oid as Id<"orders">,
              callbackUrl,
            });
            return {
              authority: r.authority,
              redirectUrl: r.redirectUrl,
              expiresAt: r.expiresAt,
            };
          },
          verify: async () => ({ status: "failed" as const }),
        });
        const init = await provider.createPayment({
          orderId,
          reference: result.paymentReference,
          amountCents: result.totalCents,
          description: `سفارش ${result.number}`,
          customer: {
            fullName: `${form.firstName} ${form.lastName}`.trim(),
            email: form.email,
          },
        });
        if (init.redirectUrl) {
          // Full-page redirect to the gateway; the callback page
          // (server-side verify) resumes the flow.
          window.location.assign(init.redirectUrl);
          return;
        }
        throw new Error("ZARINPAL_NO_REDIRECT");
      } catch (err) {
        const message = mapPlaceError((err as Error)?.message ?? "");
        setPlaceError(message);
        setPending(null);
        toast.error(message);
        // Release the inventory hold so the customer can retry.
        await cancelPendingMut({
          orderId,
          paymentStatus: "cancelled",
          note: "شروع پرداخت ناموفق",
        }).catch(() => {});
        return;
      }
    }

    // ── Mock gateway (demo) ────────────────────────────────────
    const provider = getPaymentProvider("mock");
    void provider
      .createPayment({
        orderId,
        reference: result.paymentReference,
        amountCents: result.totalCents,
        description: `سفارش ${result.number}`,
        customer: { fullName: `${form.firstName} ${form.lastName}`.trim(), email: form.email },
      })
      .catch(() => {});
    connectTimer.current = setTimeout(() => setPaymentPhase("gateway"), 1400);
  };

  const placeOrder = async () => {
    const finalErrors = validateStep(2);
    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      return;
    }
    if (!sessionId) return;
    setPlacing(true);
    setPlaceError(null);
    try {
      const method = shippingOption?.code ?? "express";
      const result = await placeOrderMut({
        lines: lines.map((l) => ({
          productId: l.productId,
          size: l.size,
          color: l.color,
          quantity: l.quantity,
        })),
        couponCode: applied?.code,
        shipping: {
          fullName: `${form.firstName} ${form.lastName}`.trim(),
          line1: form.address,
          city: form.city,
          region: "ایران",
          postalCode: form.postal,
          country: form.country,
          method: method as "standard" | "express" | "white_glove",
        },
      });
      await startPayment(result);
    } catch (err) {
      const message = mapPlaceError((err as Error)?.message ?? "");
      setPlaceError(message);
      toast.error(message);
    } finally {
      setPlacing(false);
    }
  };

  const payNow = async () => {
    if (!pending || !sessionId) return;
    setPaymentPhase("processing");
    setGatewayError(null);
    try {
      const provider = getPaymentProvider("mock");
      const verdict = await provider.verifyPayment({
        reference: pending.reference,
        orderId: pending.orderId,
      });
      if (verdict !== "paid") throw new Error("PAYMENT_DECLINED");
      await confirmPaymentMut({ orderId: pending.orderId as Id<"orders"> });
      // Drop the used coupon from the cart so it doesn't stick around.
      await setCartMeta({ sessionId, couponCode: undefined }).catch(() => {});
      setOrderNumber(pending.number);
      setPending(null);
      setPlaced(true);
      clear();
      toast.placement.success(pending.number);
    } catch (err) {
      const message = mapPlaceError((err as Error)?.message ?? "");
      setGatewayError(message);
      setPaymentPhase("gateway");
      toast.error(message);
    }
  };

  const cancelPayment = async () => {
    if (!pending) return;
    setPaymentPhase("processing");
    setGatewayError(null);
    try {
      await cancelPendingMut({
        orderId: pending.orderId as Id<"orders">,
        paymentStatus: "cancelled",
        note: "انصراف مشتری از پرداخت",
      });
      setPlaceError("پرداخت لغو شد؛ موجودی رزرو شده آزاد شد و سبد شما حفظ شد.");
      setPending(null);
      toast.error("پرداخت لغو شد");
    } catch (err) {
      const message = mapPlaceError((err as Error)?.message ?? "");
      setGatewayError(message);
      setPaymentPhase("gateway");
    }
  };

  if (placed) {
    return <Success orderNumber={orderNumber} email={form.email} onContinue={() => { clear(); setPlaced(false); setStep(0); }} />;
  }

  return (
    <div className="mx-auto max-w-[1728px] px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <header>
        <p className="type-eyebrow text-ink-muted">پرداخت امن</p>
        <h1 className="mt-3 flex items-center gap-3 font-display text-4xl text-ink lg:text-5xl">
          تکمیل خرید از لونا
          <Lock className="h-4 w-4 text-ink-muted" />
        </h1>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div>
          {/* Step indicator */}
          <ol className="flex flex-wrap items-center gap-3">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-full text-xs font-medium",
                    i < step
                      ? "bg-primary text-canvas"
                      : i === step
                      ? "bg-ink text-canvas"
                      : "hairline text-ink-soft"
                  )}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : (i + 1).toLocaleString("fa-IR")}
                </span>
                <span
                  className={cn(
                    "text-[11px] uppercase tracking-[0.18em]",
                    i === step ? "text-ink" : "text-ink-muted"
                  )}
                >
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="ml-3 h-px w-8 bg-edge sm:w-12" />
                )}
              </li>
            ))}
          </ol>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.4, ease: EASE_LUXURY }}
              className="glass mt-10 rounded-3xl p-8"
            >
              {step === 0 && (
                <div className="grid gap-4">
                  <Header icon={<ShoppingBag className="h-4 w-4" />} eyebrow="مرحله ۰۱" title="اطلاعات تماس" />
                  <Field label="ایمیل" value={form.email} onChange={(v) => set("email", v)} placeholder="name@example.com" type="email" error={errors.email} />
                  <Field label="تلفن (اختیاری)" value={form.phone} onChange={(v) => set("phone", v)} placeholder="۰۹۱۲ ۰۰۰ ۰۰۰۰" type="tel" error={errors.phone} />
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-4">
                  <Header icon={<MapPin className="h-4 w-4" />} eyebrow="مرحله ۰۲" title="آدرس ارسال" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="نام" value={form.firstName} onChange={(v) => set("firstName", v)} error={errors.firstName} />
                    <Field label="نام خانوادگی" value={form.lastName} onChange={(v) => set("lastName", v)} error={errors.lastName} />
                  </div>
                  <Field label="آدرس" value={form.address} onChange={(v) => set("address", v)} error={errors.address} />
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="شهر" value={form.city} onChange={(v) => set("city", v)} error={errors.city} />
                    <Field label="کد پستی" value={form.postal} onChange={(v) => set("postal", v)} error={errors.postal} />
                    <Field
                      label="کشور"
                      value={form.country}
                      onChange={(v) => set("country", v)}
                    >
                      <select
                        value={form.country}
                        onChange={(e) => set("country", e.target.value)}
                        className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {["ایران", "امارات", "ترکیه", "آلمان", "فرانسه", "انگلستان"].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {shippingOptions.map((opt) => (
                      <label
                        key={opt.code}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-edge/70 px-4 py-3 text-sm transition hover:bg-white/60",
                          shippingMethod === opt.code && "border-primary bg-white/60"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              "grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 transition",
                              shippingMethod === opt.code ? "border-primary" : "border-edge"
                            )}
                          >
                            {shippingMethod === opt.code && (
                              <span className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </span>
                          <span className="text-ink">{opt.name} · {opt.estimatedDays} روز کاری</span>
                        </span>
                        <span className="text-ink-muted type-caption">
                          {opt.priceCents === 0 ? "رایگان" : formatPrice(opt.priceCents)}
                        </span>
                        <input
                          type="radio"
                          className="sr-only"
                          name="shipping"
                          checked={shippingMethod === opt.code}
                          onChange={() => setShippingMethod(opt.code)}
                          aria-label={opt.name}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-4">
                  <Header icon={<CreditCard className="h-4 w-4" />} eyebrow="مرحله ۰۳" title="پرداخت" />
                  <Field
                    label="شماره کارت"
                    value={form.card}
                    onChange={(v) => set("card", formatCardNumber(v))}
                    placeholder="•••• •••• •••• ••••"
                    error={errors.card}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="تاریخ انقضا"
                      value={form.expiry}
                      onChange={(v) => set("expiry", formatExpiry(v))}
                      placeholder="ماه/سال"
                      error={errors.expiry}
                    />
                    <Field
                      label="کد امنیتی"
                      value={form.cvc}
                      onChange={(v) => set("cvc", v.replace(/\D/g, "").slice(0, 4))}
                      placeholder="•••"
                      error={errors.cvc}
                    />
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
                    <Lock className="h-3.5 w-3.5" />
                    رمزنگاری سرتاسری. اطلاعات کارت شما ذخیره نمی‌شود. با ثبت سفارش، موجودی برای شما رزرو می‌شود.
                  </p>
                </div>
              )}

              <div className="mt-10 flex items-center justify-between">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0 || placing}
                  className="text-[11px] uppercase tracking-[0.18em] text-ink-soft disabled:opacity-30"
                >
                  بازگشت
                </button>
                <div className="flex flex-col items-end gap-2">
                  {placeError && (
                    <p className="max-w-xs text-xs text-destructive">{placeError}</p>
                  )}
                  <button
                    onClick={() => {
                      const errs = validateStep(step);
                      if (Object.keys(errs).length > 0) {
                        setErrors(errs);
                        return;
                      }
                      if (step === STEPS.length - 1) {
                        placeOrder();
                      } else {
                        setStep((s) => Math.min(STEPS.length - 1, s + 1));
                      }
                    }}
                    disabled={placing}
                    className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary disabled:opacity-50"
                  >
                    {placing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      step === STEPS.length - 1 ? "ثبت نهایی سفارش" : "ادامه"
                    )}
                    {!placing && <ArrowLeft className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="lg:sticky lg:top-32 lg:h-fit">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_LUXURY }}
            className="glass-strong rounded-3xl p-8"
          >
            <p className="type-eyebrow text-ink-muted">سفارش شما</p>
            <ul className="mt-6 max-h-72 space-y-4 overflow-y-auto pr-2">
              {items.map((item) => (
                <li key={`${item.product?.id}-${item.size}-${item.color}`} className="flex items-center gap-3">
                  <div className="h-14 w-12 overflow-hidden rounded-lg">
                    <ProductImage
                      gradient={
                        item.product?.colors.find((c) => c.name === item.color)?.gradient
                      }
                      silhouette={silhouetteFor(item.product?.category ?? "accessories")}
                      withMark={false}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm text-ink">{item.product?.name}</p>
                    <p className="text-[11px] text-ink-muted">
                      {item.color} · {item.size} × {item.quantity.toLocaleString("fa-IR")}
                    </p>
                  </div>
                  <span className="text-sm type-caption text-ink">
                    {formatPrice((item.product?.price ?? 0) * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-6 space-y-3 border-t border-edge/70 pt-6 text-sm">
              <div className="flex items-baseline justify-between">
                <dt className="text-ink-soft">جمع جزء</dt>
                <dd className="type-caption text-ink">{formatPrice(subtotal)}</dd>
              </div>
              {applied && (
                <div className="flex items-baseline justify-between text-primary">
                  <dt>{applied.code}</dt>
                  <dd className="type-caption">−{formatPrice(discount)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <dt className="text-ink-soft">ارسال</dt>
                <dd className="type-caption text-ink">
                  {shippingPrice === 0 ? "رایگان" : formatPrice(shippingPrice)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-edge/70 pt-3">
                <dt className="font-display text-xl text-ink">مجموع نهایی</dt>
                <dd className="font-display text-xl type-caption text-ink">
                  {formatPrice(total)}
                </dd>
              </div>
            </dl>
          </motion.div>
        </aside>
      </div>

      {/* ── Phase 8.1: payment gateway overlay ────────────────── */}
      <AnimatePresence>
        {pending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-items-center bg-ink/60 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.45, ease: EASE_LUXURY }}
              className="glass-strong w-full max-w-md overflow-hidden rounded-[2rem]"
            >
              {paymentPhase === "connecting" && (
                <div className="px-8 py-14 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ink text-canvas">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <p className="type-eyebrow mt-6 text-ink-muted">درگاه پرداخت امن</p>
                  <h2 className="mt-2 font-display text-2xl text-ink">
                    در حال اتصال به درگاه…
                  </h2>
                  <p className="mx-auto mt-3 max-w-xs text-xs leading-relaxed text-ink-soft">
                    موجودی سبد شما برای {toPersianDigits(30)} دقیقه رزرو شد. اتصال شما رمزنگاری شده است.
                  </p>
                  <Loader2 className="mx-auto mt-6 h-5 w-5 animate-spin text-primary" />
                </div>
              )}

              {paymentPhase === "gateway" && (
                <div className="px-8 py-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <p className="type-eyebrow text-ink-muted">درگاه پرداخت لونا</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
                      <Lock className="h-3 w-3" /> اتصال امن
                    </span>
                  </div>

                  <div className="mt-8 text-center">
                    <p className="text-xs text-ink-muted">مبلغ قابل پرداخت</p>
                    <p className="mt-2 font-display text-4xl text-ink">
                      {formatPrice(pending.amountCents)}
                    </p>
                    <p className="mt-3 text-[11px] text-ink-muted">
                      سفارش {pending.number}
                    </p>
                    <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-ink-muted" dir="ltr">
                      <Timer className="h-3 w-3" />
                      {pending.reference}
                    </p>
                  </div>

                  {gatewayError && (
                    <p className="mt-5 rounded-2xl bg-destructive/10 px-4 py-3 text-center text-xs text-destructive">
                      {gatewayError}
                    </p>
                  )}

                  <div className="mt-8 grid gap-3">
                    <button
                      onClick={payNow}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary"
                    >
                      <Check className="h-4 w-4" />
                      پرداخت آزمایشی موفق
                    </button>
                    <button
                      onClick={cancelPayment}
                      className="inline-flex items-center justify-center gap-2 rounded-full hairline px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft transition hover:bg-white/60 hover:text-ink"
                    >
                      <X className="h-3.5 w-3.5" />
                      انصراف از پرداخت
                    </button>
                  </div>

                  <p className="mt-5 text-center text-[10px] leading-relaxed text-ink-soft">
                    این یک درگاه آزمایشی است و پرداخت واقعی انجام نمی‌شود.
                  </p>
                </div>
              )}

              {paymentPhase === "processing" && (
                <div className="px-8 py-14 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  <p className="mt-5 font-display text-xl text-ink">در حال تأیید پرداخت…</p>
                  <p className="mx-auto mt-2 max-w-xs text-xs text-ink-soft">
                    پس از تأیید، موجودی از رزرو خارج و سفارش شما وارد مرحله پردازش می‌شود.
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Header({
  icon,
  eyebrow,
  title,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-full hairline bg-white/60 text-ink">
        {icon}
      </span>
      <div>
        <p className="type-eyebrow text-ink-muted">{eyebrow}</p>
        <h2 className="font-display text-2xl text-ink">{title}</h2>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  children?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="type-eyebrow text-ink-muted">{label}</span>
      {children ?? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={type}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          dir="ltr"
          className={cn(
            "mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-ink-muted transition",
            "focus:outline-none focus:ring-2",
            error ? "ring-1 ring-destructive" : "focus:ring-primary"
          )}
        />
      )}
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </label>
  );
}

function Success({
  orderNumber,
  email,
  onContinue,
}: {
  orderNumber: string;
  email: string;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE_LUXURY }}
      className="mx-auto max-w-2xl px-6 pt-32 pb-24 text-center lg:px-10"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE_LUXURY }}
        className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-ink text-canvas"
      >
        <Check className="h-9 w-9" />
      </motion.div>
      <p className="type-eyebrow mt-8 text-ink-muted">پرداخت موفق · سفارش {orderNumber}</p>
      <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-6xl">
        سپاس از شما.
      </h1>
      <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-ink-soft">
        پرداخت سفارش <span className="text-ink">{orderNumber}</span> تأیید شد.
        نامه‌ای به آدرس <span className="text-ink" dir="ltr">{email || "ایمیل شما"}</span> ارسال خواهد شد.
        بوتیک لونا سفارش شما را با دقت آماده و ارسال می‌کند. بسته‌بندی محرمانه و ظریف، مطابق
        استاندارد لونا.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          پیگیری سفارش
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
        <button
          onClick={onContinue}
          className="rounded-full hairline bg-canvas/60 px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft hover:bg-white"
        >
          ادامه خرید
        </button>
      </div>
    </motion.div>
  );
}

function toPersianDigits(n: number): string {
  return n.toLocaleString("fa-IR");
}

function mapPlaceError(message: string): string {
  if (message.startsWith("INSUFFICIENT_STOCK"))
    return "موجودی کافی برای یکی از اقلام سبد وجود ندارد.";
  if (message.startsWith("PRODUCT_UNLISTED"))
    return "یکی از محصولات سبد دیگر در فروشگاه منتشر نیست.";
  if (message.startsWith("PRODUCT_MISSING"))
    return "یکی از محصولات سبد پیدا نشد.";
  if (message.startsWith("PRODUCT_NO_PRICE"))
    return "قیمت یکی از محصولات سبد ثبت نشده است.";
  if (message.startsWith("INVALID_COUPON"))
    return "کد تخفیف معتبر نیست.";
  if (message.startsWith("COUPON_EXHAUSTED"))
    return "کد تخفیف به پایان رسیده است.";
  if (message.startsWith("COUPON_EXPIRED"))
    return "کد تخفیف منقضی شده است.";
  if (message.startsWith("INVALID_QUANTITY"))
    return "تعداد اقلام سبد نامعتبر است.";
  if (message.startsWith("EMPTY_CART"))
    return "سبد خرید شما خالی است.";
  if (message.startsWith("ORDER_NOT_PENDING"))
    return "سفارش دیگر در وضعیت قابل پرداخت نیست.";
  if (message.startsWith("PAYMENT_NOT_ACTIVE"))
    return "پرداخت این سفارش فعال نیست.";
  if (message.startsWith("ZARINPAL_NOT_CONFIGURED"))
    return "درگاه پرداخت هنوز پیکربندی نشده است؛ از پرداخت آزمایشی استفاده کنید.";
  if (message.startsWith("ZARINPAL_REQUEST_FAILED") || message.startsWith("ZARINPAL_NO_REDIRECT"))
    return "اتصال به درگاه پرداخت ناموفق بود؛ دوباره تلاش کنید.";
  if (message.startsWith("PAYMENT_RATE_LIMITED"))
    return "درخواست پرداخت تکراری است؛ کمی صبر کنید.";
  if (message.startsWith("PAYMENT_DECLINED"))
    return "پرداخت توسط درگاه رد شد. لطفاً دوباره تلاش کنید.";
  if (message.startsWith("UNAUTHORIZED"))
    return "برای ثبت سفارش وارد حساب خود شوید.";
  return "ثبت سفارش ناموفق بود؛ لطفاً دوباره تلاش کنید.";
}

function formatCardNumber(v: string): string {
  return v
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})(?=.)/g, "$1 ")
    .trim();
}

function formatExpiry(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}
