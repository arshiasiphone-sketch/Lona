import { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { getProductById } from "@/data/catalog";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { formatPrice } from "@/lib/format";

const STEPS = ["Contact", "Shipping", "Payment"] as const;

export default function Checkout() {
  const { lines } = useCart();
  const [step, setStep] = useState(0);

  const items = lines
    .map((l) => ({ ...l, product: getProductById(l.productId) }))
    .filter((x): x is NonNullable<typeof x> => Boolean(x.product));

  const subtotal = items.reduce(
    (s, i) => s + (i.product?.price ?? 0) * i.quantity,
    0
  );
  const shipping = items.length > 0 ? (subtotal > 300 ? 0 : 18) : 0;
  const total = subtotal + shipping;

  return (
    <div className="mx-auto max-w-[1728px] px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <header>
        <p className="type-eyebrow text-ink-muted">Secure checkout</p>
        <h1 className="mt-3 flex items-center gap-3 font-display text-4xl text-ink lg:text-5xl">
          ÆON Checkout <Lock className="h-4 w-4 text-ink-muted" />
        </h1>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div>
          {/* Step indicator */}
          <ol className="flex items-center gap-4">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-full text-xs font-medium",
                    i <= step
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
                  <span className="ml-3 h-px w-12 bg-edge" />
                )}
              </li>
            ))}
          </ol>

          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: EASE_LUXURY }}
            className="glass mt-10 rounded-3xl p-8"
          >
            {step === 0 && (
              <div className="grid gap-4">
                <h2 className="font-display text-2xl text-ink">Contact</h2>
                <label className="block">
                  <span className="type-eyebrow text-ink-muted">Email</span>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </label>
                <label className="block">
                  <span className="type-eyebrow text-ink-muted">Phone (optional)</span>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </label>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4">
                <h2 className="font-display text-2xl text-ink">Shipping</h2>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="type-eyebrow text-ink-muted">First name</span>
                    <input className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary" />
                  </label>
                  <label className="block">
                    <span className="type-eyebrow text-ink-muted">Last name</span>
                    <input className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary" />
                  </label>
                </div>
                <label className="block">
                  <span className="type-eyebrow text-ink-muted">Address</span>
                  <input className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary" />
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <label className="block">
                    <span className="type-eyebrow text-ink-muted">City</span>
                    <input className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary" />
                  </label>
                  <label className="block">
                    <span className="type-eyebrow text-ink-muted">Postal</span>
                    <input className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary" />
                  </label>
                  <label className="block">
                    <span className="type-eyebrow text-ink-muted">Country</span>
                    <select className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>United States</option>
                      <option>Italy</option>
                      <option>Japan</option>
                      <option>United Kingdom</option>
                    </select>
                  </label>
                </div>
                <div className="grid gap-3">
                  {[
                    { id: "std", label: "Standard · 5–8 days", price: 0 },
                    { id: "exp", label: "Express · 2–3 days", price: 24 },
                    { id: "white", label: "White-glove · Next-day in major cities", price: 64 },
                  ].map((s, idx) => (
                    <label
                      key={s.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-2xl border border-edge/70 px-4 py-3 text-sm transition hover:bg-white/60",
                        idx === 1 && "bg-white/60"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-ink">{s.label}</span>
                      </span>
                      <span className="text-ink-muted type-caption">
                        {s.price === 0 ? "Included" : `$${s.price}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-4">
                <h2 className="font-display text-2xl text-ink">Payment</h2>
                <div className="grid gap-3">
                  <label className="block">
                    <span className="type-eyebrow text-ink-muted">Card number</span>
                    <input
                      placeholder="•••• •••• •••• ••••"
                      className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm tracking-widest text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="type-eyebrow text-ink-muted">Expiry</span>
                      <input
                        placeholder="MM/YY"
                        className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>
                    <label className="block">
                      <span className="type-eyebrow text-ink-muted">CVC</span>
                      <input
                        placeholder="•••"
                        className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>
                  </div>
                </div>
                <p className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
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
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="rounded-full bg-ink px-7 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary"
              >
                {step === STEPS.length - 1 ? "Place Order" : "Continue"}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Order summary */}
        <aside className="lg:sticky lg:top-32 lg:h-fit">
          <div className="glass-strong rounded-3xl p-8">
            <p className="type-eyebrow text-ink-muted">Order</p>
            <ul className="mt-6 space-y-4">
              {items.length === 0 && (
                <li className="text-sm text-ink-soft">
                  Your bag is empty.{" "}
                  <Link to="/shop" className="underline-offset-4 hover:underline text-ink">
                    Return to catalogue
                  </Link>
                </li>
              )}
              {items.map((item) => (
                <li key={`${item.product?.id}-${item.size}-${item.color}`} className="flex items-center gap-3">
                  <div className="h-14 w-12 overflow-hidden rounded-lg">
                    <ProductImage
                      gradient={
                        item.product?.colors.find((c) => c.name === item.color)?.gradient === "oat"
                          ? "gradient-oat"
                          : item.product?.colors.find((c) => c.name === item.color)?.gradient === "mist"
                          ? "gradient-mist"
                          : item.product?.colors.find((c) => c.name === item.color)?.gradient === "rose"
                          ? "gradient-rose-quartz"
                          : "gradient-deep"
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
                  <div className="flex-1">
                    <p className="text-sm text-ink">{item.product?.name}</p>
                    <p className="text-xs text-ink-muted">
                      {item.color} · {item.size}
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
              <div className="flex items-baseline justify-between">
                <dt className="text-ink-soft">Shipping</dt>
                <dd className="type-caption text-ink">
                  {shipping === 0 ? "Complimentary" : formatPrice(shipping, true)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-edge/70 pt-3">
                <dt className="font-display text-xl text-ink">Total</dt>
                <dd className="font-display text-xl type-caption text-ink">
                  {formatPrice(total, true)}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
