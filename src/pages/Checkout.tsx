import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, MapPin, CreditCard, ShoppingBag, ArrowLeft } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useCoupon } from "@/hooks/use-coupon";
import { getProductById } from "@/data/catalog";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { formatPrice, formatOrderNumber } from "@/lib/format";
import { toast } from "@/lib/toast";

const STEPS = ["اطلاعات تماس", "ارسال", "پرداخت"] as const;

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
  const { applied } = useCoupon();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [placed, setPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>(() =>
    formatOrderNumber(Math.floor(24000 + Math.random() * 9999))
  );
  const [shippingMethod, setShippingMethod] = useState<"std" | "exp" | "white">("exp");

  const items = lines
    .map((l) => ({ ...l, product: getProductById(l.productId) }))
    .filter((x): x is NonNullable<typeof x> => Boolean(x.product));

  const subtotal = items.reduce(
    (s, i) => s + (i.product?.price ?? 0) * i.quantity,
    0
  );
  const discount = applied ? subtotal * applied.percentOff : 0;
  const shippingPrice = shippingMethod === "std" ? 0 : shippingMethod === "exp" ? 250000 : 650000;
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

  const placeOrder = async () => {
    const finalErrors = validateStep(2);
    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 900));
    const number = formatOrderNumber(Math.floor(24000 + Math.random() * 9999));
    setOrderNumber(number);
    setPlaced(true);
    toast.placement.success(number);
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
                    {[
                      { id: "std", label: "ارسال عادی · ۵ تا ۸ روز کاری", price: 0 },
                      { id: "exp", label: "ارسال سریع · ۲ تا ۳ روز کاری", price: 250000 },
                      { id: "white", label: "ارسال ویژه · روز بعد در شهرهای بزرگ", price: 650000 },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-edge/70 px-4 py-3 text-sm transition hover:bg-white/60",
                          shippingMethod === opt.id && "border-primary bg-white/60"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              "grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 transition",
                              shippingMethod === opt.id ? "border-primary" : "border-edge"
                            )}
                          >
                            {shippingMethod === opt.id && (
                              <span className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </span>
                          <span className="text-ink">{opt.label}</span>
                        </span>
                        <span className="text-ink-muted type-caption">
                          {opt.price === 0 ? "رایگان" : formatPrice(opt.price, true)}
                        </span>
                        <input
                          type="radio"
                          className="sr-only"
                          name="shipping"
                          checked={shippingMethod === opt.id}
                          onChange={() =>
                            setShippingMethod(opt.id as typeof shippingMethod)
                          }
                          aria-label={opt.label}
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
                    رمزنگاری سرتاسری. اطلاعات کارت شما ذخیره نمی‌شود.
                  </p>
                </div>
              )}

              <div className="mt-10 flex items-center justify-between">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="text-[11px] uppercase tracking-[0.18em] text-ink-soft disabled:opacity-30"
                >
                  بازگشت
                </button>
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
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary"
                >
                  {step === STEPS.length - 1 ? "ثبت نهایی سفارش" : "ادامه"}
                  <ArrowLeft className="h-4 w-4" />
                </button>
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
                <dd className="type-caption text-ink">{formatPrice(subtotal, true)}</dd>
              </div>
              {applied && (
                <div className="flex items-baseline justify-between text-primary">
                  <dt>{applied.code}</dt>
                  <dd className="type-caption">−{formatPrice(discount, true)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <dt className="text-ink-soft">ارسال</dt>
                <dd className="type-caption text-ink">
                  {shippingPrice === 0 ? "رایگان" : formatPrice(shippingPrice, true)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-edge/70 pt-3">
                <dt className="font-display text-xl text-ink">مجموع نهایی</dt>
                <dd className="font-display text-xl type-caption text-ink">
                  {formatPrice(total, true)}
                </dd>
              </div>
            </dl>
          </motion.div>
        </aside>
      </div>
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
      <p className="type-eyebrow mt-8 text-ink-muted">سفارش شما ثبت شد · شماره {orderNumber}</p>
      <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-6xl">
        سپاس از شما.
      </h1>
      <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-ink-soft">
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
