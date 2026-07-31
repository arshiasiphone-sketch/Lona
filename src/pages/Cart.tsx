import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, X, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useCart, type CartLine } from "@/hooks/use-cart";
import { useCoupon, type UseCouponReturn } from "@/hooks/use-coupon";
import { getProductById, products, type Product } from "@/data/catalog";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn, glassClass } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { formatPrice } from "@/lib/format";
import { toast } from "@/lib/toast";
import { EmptyCart } from "@/components/customer/EmptyStates";

type EnrichedLine = CartLine & { product: Product };

const silhouetteFor = (cat: string) => {
  switch (cat) {
    case "intimates-bras": return "bra" as const;
    case "intimates-briefs": return "brief" as const;
    case "sleepwear": return "robe" as const;
    case "homewear": return "tee" as const;
    case "bodysuits": return "bodysuit" as const;
    case "shapewear": return "bodysuit" as const;
    case "loungewear-sets": return "robe" as const;
    case "accessories": return "accessory" as const;
    default: return "accessory" as const;
  }
};

const gradientFor = (k: string) =>
  k === "oat" ? "gradient-oat" : k === "deep" ? "gradient-deep" : k === "rose" ? "gradient-rose-quartz" : "gradient-mist";

const recommendedIds = ["p-007", "p-011", "p-005"];

export default function Cart() {
  const { lines, update, remove, clear } = useCart();
  const { applied, apply, remove: removeCoupon } = useCoupon();
  const [gift, setGift] = useState("");

  const items: EnrichedLine[] = lines.flatMap((line) => {
    const product = getProductById(line.productId);
    return product ? [{ ...line, product }] : [];
  });

  const recommended: Product[] = recommendedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  if (items.length === 0) return <EmptyCart />;

  const subtotal = items.reduce(
    (s, i) => s + (i.product?.price ?? 0) * i.quantity,
    0
  );
  const discount = applied ? subtotal * applied.percentOff : 0;
  const shipping = subtotal - discount > 5000000 ? 0 : 250000;
  const total = subtotal - discount + shipping;

  return (
    <div className="mx-auto max-w-[1728px] px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <header className="flex items-end justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">سبد خرید</p>
          <h1 className="mt-3 font-display text-4xl text-ink lg:text-6xl">
            انتخاب‌های شما
          </h1>
        </div>
        <button
          onClick={() => {
            clear();
          }}
          className="text-[11px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink"
        >
          خالی کردن سبد
        </button>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.article
                key={`${item.product.id}-${item.size}-${item.color}`}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.4, ease: EASE_LUXURY }}
                className={cn("glass flex items-stretch gap-4 rounded-2xl p-4")}
              >
                <Link
                  to={`/shop/${item.product.slug}`}
                  className="h-32 w-24 shrink-0 overflow-hidden rounded-xl sm:h-40 sm:w-32"
                >
                  <ProductImage
                    gradient={
                      item.product?.colors.find((c) => c.name === item.color)?.gradient
                    }
                    silhouette={silhouetteFor(item.product?.category ?? "accessories")}
                    withMark={false}
                    className="h-full w-full"
                  />
                </Link>
                <div className="flex flex-1 flex-col justify-between py-1">
                  <div>
                    <p className="type-eyebrow text-ink-muted">
                      {item.color} · {item.size}
                    </p>
                    <Link
                      to={`/shop/${item.product.slug}`}
                      className="mt-1 font-display text-lg text-ink hover:text-primary"
                    >
                      {item.product?.name}
                    </Link>
                    {item.color !== item.product?.colors[0].name && (
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                        رنگ سفارشی
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className={cn(glassClass("subtle"), "flex items-center rounded-full px-1")}>
                      <button
                        onClick={() =>
                          update(item.product.id, item.size, item.color, item.quantity - 1)
                        }
                        className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-white/60"
                        aria-label="کاهش تعداد"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[1.5rem] text-center text-xs font-medium text-ink">
                        {item.quantity.toLocaleString("fa-IR")}
                      </span>
                      <button
                        onClick={() =>
                          update(item.product.id, item.size, item.color, item.quantity + 1)
                        }
                        className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-white/60"
                        aria-label="افزایش تعداد"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm text-ink type-caption">
                      {formatPrice((item.product?.price ?? 0) * item.quantity)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    remove(item.product.id, item.size, item.color);
                    toast.removed(item.product?.name ?? "محصول");
                  }}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full hairline text-ink-soft hover:bg-white/60 hover:text-ink"
                  aria-label="حذف از سبد"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.article>
            ))}
          </AnimatePresence>

          {/* Cross-sell */}
          <section className="mt-10 rounded-3xl glass-strong p-7">
            <p className="type-eyebrow text-ink-muted">پیشنهاد بوتیک</p>
            <p className="mt-2 text-sm text-ink-soft">
              ترکیب‌هایی که بوتیک ما برایتان پیشنهاد می‌دهد.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-3">
              {recommended.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-canvas/60 p-3">
                  <div className="h-16 w-12 overflow-hidden rounded-lg">
                    <ProductImage
                      gradient={p.colors[0].gradient}
                      silhouette={silhouetteFor(p.category)}
                      withMark={false}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-ink">{p.name}</p>
                    <p className="text-[11px] text-ink-muted">{formatPrice(p.price)}</p>
                  </div>
                  <Link
                    to={`/shop/${p.slug}`}
                    className="text-[10px] uppercase tracking-[0.18em] text-ink-soft hover:text-ink"
                  >
                    مشاهده
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-32 lg:h-fit">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_LUXURY }}
            className="glass-strong rounded-3xl p-8"
          >
            <p className="type-eyebrow text-ink-muted">خلاصه سفارش</p>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex items-baseline justify-between">
                <dt className="text-ink-soft">جمع جزء</dt>
                <dd className="type-caption text-ink">{formatPrice(subtotal, true)}</dd>
              </div>
              {applied && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3, ease: EASE_LUXURY }}
                  className="flex items-baseline justify-between text-primary"
                >
                  <dt>{applied.code}</dt>
                  <dd className="type-caption">−{formatPrice(discount, true)}</dd>
                </motion.div>
              )}
              <div className="flex items-baseline justify-between">
                <dt className="text-ink-soft">ارسال</dt>
                <dd className="type-caption text-ink">
                  {shipping === 0 ? "رایگان" : formatPrice(shipping, true)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-ink-soft">مالیات</dt>
                <dd className="text-ink-muted">در مرحله بعد</dd>
              </div>
              <div className="h-px bg-edge/70" />
              <motion.div
                layout
                className="flex items-baseline justify-between"
              >
                <dt className="font-display text-xl text-ink">مجموع</dt>
                <dd className="font-display text-xl text-ink type-caption">
                  {formatPrice(total, true)}
                </dd>
              </motion.div>
            </dl>

            <CouponInput applied={applied} onApply={apply} onRemove={removeCoupon} />

            <GiftNoteInput value={gift} onChange={setGift} />

            <Link
              to="/checkout"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary"
            >
              ادامه فرایند خرید
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <p className="mt-4 text-center text-xs text-ink-muted">
              پرداخت امن. رمزنگاری سرتاسری.
            </p>
          </motion.div>
        </aside>
      </div>
    </div>
  );
}

function CouponInput({
  applied,
  onApply,
  onRemove,
}: {
  applied: UseCouponReturn["applied"];
  onApply: UseCouponReturn["apply"];
  onRemove: UseCouponReturn["remove"];
}) {
  const [code, setCode] = useState(applied?.code ?? "");
  return (
    <div className="mt-6">
      <p className="type-eyebrow text-ink-muted">کد تخفیف</p>
      <div className="mt-2 flex items-center gap-2 rounded-full hairline bg-canvas/60 px-3 py-2">
        {applied ? (
          <>
            <span className="flex-1 text-sm font-medium text-ink">
              کد {applied.code} اعمال شد · {Math.round(applied.percentOff * 100)}٪ تخفیف
            </span>
            <button
              onClick={() => {
                onRemove();
                toast.coupon.removed();
                setCode("");
              }}
              className="text-[10px] uppercase tracking-[0.18em] text-ink-soft hover:text-ink"
            >
              حذف
            </button>
          </>
        ) : (
          <>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="کد تخفیف (مثلاً WELCOME10)"
              dir="ltr"
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
            />
            <button
              onClick={() => {
                const result = onApply(code);
                if (result) toast.coupon.applied(result.code, result.percentOff);
                else toast.coupon.invalid();
              }}
              className="rounded-full bg-ink px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
            >
              اعمال
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function GiftNoteInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 rounded-2xl hairline bg-canvas/60">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-right"
      >
        <span className="text-[11px] uppercase tracking-[0.18em] text-ink">
          یادداشت هدیه
        </span>
        <span className="text-[11px] text-ink-muted">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="یک یادداشت کوتاه که روی کارت بوتیک لونا با خط نستعلیق چاپ می‌شود."
            rows={3}
            className={cn(
              "mt-2 w-full resize-none rounded-xl bg-white/60 px-3 py-2 text-sm text-ink placeholder:text-ink-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary"
            )}
          />
          <p className="mt-2 text-[11px] text-ink-muted">
            تا ۸۰ کاراکتر.
          </p>
        </div>
      )}
    </div>
  );
}
