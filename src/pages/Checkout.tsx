import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, MapPin, CreditCard, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useCoupon } from "@/hooks/use-coupon";
import { getProductById } from "@/data/catalog";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { formatPrice } from "@/lib/format";
import { toast } from "@/lib/toast";

const STEPS = ["Contact", "Shipping", "Payment"] as const;

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

export default function Checkout() {
  const { lines, clear } = useCart();
  const { applied } = useCoupon();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [placed, setPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>(() =>
    `Æ-${Math.floor(24000 + Math.random() * 9999)}`
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
  const shippingPrice = shippingMethod === "std" ? 0 : shippingMethod === "exp" ? 24 : 64;
  const total = subtotal - discount + shippingPrice;

  // Field refs (simple — Uncontrolled with forwardRef would be nicer, but state-driven is fine here.)
  const [form, setForm] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postal: "",
    country: "United States",
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
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email.";
        if (form.phone && !/^[+]?[\d\s()-]{7,}$/.test(form.phone)) errs.phone = "Looks off — check the number.";
      }
      if (s === 1) {
        if (!req(form.firstName)) errs.firstName = "Required";
        if (!req(form.lastName)) errs.lastName = "Required";
        if (!req(form.address)) errs.address = "Required";
        if (!req(form.city)) errs.city = "Required";
        if (!req(form.postal)) errs.postal = "Required";
      }
      if (s === 2) {
        const digits = form.card.replace(/\s+/g, "");
        if (digits.length < 13 || digits.length > 19) errs.card = "Enter a valid card number.";
        if (!/^\d{2}\/\d{2}$/.test(form.expiry)) errs.expiry = "Use MM/YY format.";
        if (!/^\d{3,4}$/.test(form.cvc.trim())) errs.cvc = "Enter the security code.";
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
        <p className="type-eyebrow text-ink-muted">Checkout</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-6xl">
          Your bag is quiet.
        </h1>
        <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-ink-soft">
          Add a piece before proceeding.
        </p>
        <Link
          to="/shop"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          Browse Catalogue
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  /** Handle "Place Order" with simulated network delay. */
  const placeOrder = async () => {
    const finalErrors = validateStep(2);
    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      return;
    }
    // simulated 900ms
    await new Promise((resolve) => setTimeout(resolve, 900));
    const number = `Æ-${Math.floor(24000 + Math.random() * 9999)}`;
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
        <p className="type-eyebrow text-ink-muted">Secure checkout</p>
        <h1 className="mt-3 flex items-center gap-3 font-display text-4xl text-ink lg:text-5xl">
          ÆON Checkout
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
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
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
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.4, ease: EASE_LUXURY }}
              className="glass mt-10 rounded-3xl p-8"
            >
              {step === 0 && (
                <div className="grid gap-4">
                  <Header icon={<ShoppingBag className="h-4 w-4" />} eyebrow="Step 01" title="Contact" />
                  <Field label="Email" value={form.email} onChange={(v) => set("email", v)} placeholder="name@example.com" type="email" error={errors.email} />
                  <Field label="Phone (optional)" value={form.phone} onChange={(v) => set("phone", v)} placeholder="+1 (555) 000-0000" type="tel" error={errors.phone} />
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-4">
                  <Header icon={<MapPin className="h-4 w-4" />} eyebrow="Step 02" title="Shipping" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First name" value={form.firstName} onChange={(v) => set("firstName", v)} error={errors.firstName} />
                    <Field label="Last name" value={form.lastName} onChange={(v) => set("lastName", v)} error={errors.lastName} />
                  </div>
                  <Field label="Address" value={form.address} onChange={(v) => set("address", v)} error={errors.address} />
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="City" value={form.city} onChange={(v) => set("city", v)} error={errors.city} />
                    <Field label="Postal" value={form.postal} onChange={(v) => set("postal", v)} error={errors.postal} />
                    <Field
                      label="Country"
                      value={form.country}
                      onChange={(v) => set("country", v)}
                    >
                      <select
                        value={form.country}
                        onChange={(e) => set("country", e.target.value)}
                        className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {["United States", "Italy", "Japan", "United Kingdom", "Germany", "France"].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {[
                      { id: "std", label: "Standard · 5–8 days", price: 0 },
                      { id: "exp", label: "Express · 2–3 days", price: 24 },
                      { id: "white", label: "White-glove · Next-day in major cities", price: 64 },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={cn(
                          "flex cursor-pointer items-center justify-between rounded-2xl border border-edge/70 px-4 py-3 text-sm transition hover:bg-white/60",
                          shippingMethod === opt.id && "border-primary bg-white/60"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={cn(
                              "grid h-4 w-4 place-items-center rounded-full border-2 transition",
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
                          {opt.price === 0 ? "Included" : `$${opt.price}`}
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
                  <Header icon={<CreditCard className="h-4 w-4" />} eyebrow="Step 03" title="Payment" />
                  <Field
                    label="Card number"
                    value={form.card}
                    onChange={(v) => set("card", formatCardNumber(v))}
                    placeholder="•••• •••• •••• ••••"
                    error={errors.card}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Expiry"
                      value={form.expiry}
                      onChange={(v) => set("expiry", formatExpiry(v))}
                      placeholder="MM/YY"
                      error={errors.expiry}
                    />
                    <Field
                      label="CVC"
                      value={form.cvc}
                      onChange={(v) => set("cvc", v.replace(/\D/g, "").slice(0, 4))}
                      placeholder="•••"
                      error={errors.cvc}
                    />
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
                    <Lock className="h-3.5 w-3.5" />
                    Encrypted end-to-end. We never store card numbers.
                  </p>
                </div>
              )}

              <div className="mt-10 flex items-center justify-between">
                <button
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="text-[11px] uppercase tracking-[0.18em] text-ink-soft disabled:opacity-30"
                >
                  ← Back
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
                  className="rounded-full bg-ink px-7 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary"
                >
                  {step === STEPS.length - 1 ? "Place Order" : "Continue"}
                  <ArrowRight className="ml-2 inline h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Order summary */}
        <aside className="lg:sticky lg:top-32 lg:h-fit">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_LUXURY }}
            className="glass-strong rounded-3xl p-8"
          >
            <p className="type-eyebrow text-ink-muted">Order</p>
            <ul className="mt-6 space-y-4 scroll-luxe max-h-72 overflow-y-auto pr-2">
              {items.map((item) => (
                <li key={`${item.product?.id}-${item.size}-${item.color}`} className="flex items-center gap-3">
                  <div className="h-14 w-12 overflow-hidden rounded-lg">
                    <ProductImage
                      gradient={
                        item.product?.colors.find((c) => c.name === item.color)?.gradient
                      }
                      silhouette={
                        item.product?.category === "outerwear"
                          ? "coat"
                          : item.product?.category === "knitwear"
                          ? "knit"
                          : item.product?.category === "dresses"
                          ? "dress"
                          : item.product?.category === "trousers"
                          ? "trouser"
                          : item.product?.category === "shirting"
                          ? "shirt"
                          : item.product?.category === "leather"
                          ? "leather"
                          : "accessory"
                      }
                      withMark={false}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-1 text-sm text-ink">{item.product?.name}</p>
                    <p className="text-[11px] text-ink-muted">
                      {item.color} · {item.size} · ×{item.quantity}
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
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="type-caption text-ink">{formatPrice(subtotal, true)}</dd>
              </div>
              {applied && (
                <div className="flex items-baseline justify-between text-primary">
                  <dt>{applied.code}</dt>
                  <dd className="type-caption">−{formatPrice(discount, true)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <dt className="text-ink-soft">Shipping</dt>
                <dd className="type-caption text-ink">
                  {shippingPrice === 0 ? "Complimentary" : formatPrice(shippingPrice, true)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-edge/70 pt-3">
                <dt className="font-display text-xl text-ink">Total</dt>
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
      <p className="type-eyebrow mt-8 text-ink-muted">Confirmed · {orderNumber}</p>
      <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-6xl">
        Thank you.
      </h1>
      <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-ink-soft">
        A letter is on its way to <span className="text-ink">{email || "your inbox"}</span>.
        Your atelier will hand-set a confirmation of the makers involved. We hold your delivery in
        our care until it is ready to be sent.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/account"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          View your order
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <button
          onClick={onContinue}
          className="rounded-full hairline bg-canvas/60 px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft hover:bg-white"
        >
          Continue browsing
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
