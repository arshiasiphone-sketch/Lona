import { Link } from "react-router";
import { Minus, Plus, X, ShoppingBag, ArrowRight, Gift, Tag } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ProductImage } from "@/components/ui/ProductImage";
import { useCart } from "@/hooks/use-cart";
import { useOverlay } from "@/hooks/use-overlay";
import { useCoupon } from "@/hooks/use-coupon";
import {
  useProducts,
  getProductByIdFromList,
  type Product,
} from "@/lib/data/catalog";
import type { CartLine } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/format";
import { EASE_LUXURY } from "@/lib/motion";
import { cn } from "@/lib/glass";
import { toast } from "@/lib/toast";

type EnrichedLine = CartLine & { product: Product };

const silhouetteFor = (cat: string) => {
  switch (cat) {
    case "outerwear":
      return "coat" as const;
    case "knitwear":
      return "knit" as const;
    case "trousers":
      return "trouser" as const;
    case "shirting":
      return "shirt" as const;
    case "dresses":
      return "dress" as const;
    case "leather":
      return "leather" as const;
    default:
      return "accessory" as const;
  }
};

const gradientFor = (key: string) =>
  key === "oat"
    ? "gradient-oat"
    : key === "deep"
    ? "gradient-deep"
    : key === "rose"
    ? "gradient-rose-quartz"
    : "gradient-mist";

const recommended = ["p-007", "p-011", "p-005"];

export function SideCart() {
  const { lines, update, remove } = useCart();
  const { sideCartOpen, closeSideCart } = useOverlay();
  const { applied, apply, remove: removeCoupon } = useCoupon();
  const liveProducts = useProducts();

  const items: EnrichedLine[] = lines.flatMap((line) => {
    const product = getProductByIdFromList(liveProducts, line.productId);
    return product ? [{ ...line, product }] : [];
  });

  const subtotal = items.reduce(
    (s, i) => s + (i.product?.price ?? 0) * i.quantity,
    0
  );
  const discount = applied ? subtotal * applied.percentOff : 0;
  const shipping = items.length === 0 ? 0 : subtotal - discount > 300 ? 0 : 18;
  const total = subtotal - discount + shipping;

  return (
    <Sheet open={sideCartOpen} onOpenChange={(open) => !open && closeSideCart()}>
      <SheetContent
        side="right"
        className="glass-strong flex w-full flex-col gap-0 border-l border-edge/70 p-0 sm:max-w-md [&>button]:hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-edge/60 px-6 py-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-ink" />
            <SheetTitle className="font-display text-2xl text-ink">
              Your bag
            </SheetTitle>
          </div>
          <button
            onClick={closeSideCart}
            className="grid h-9 w-9 place-items-center rounded-full hairline text-ink-soft hover:bg-white/60 hover:text-ink"
            aria-label="Close bag"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <SheetDescription className="sr-only">
          {items.length} {items.length === 1 ? "piece" : "pieces"} in your bag.
        </SheetDescription>

        {items.length === 0 ? (
          <EmptyBag onClose={closeSideCart} />
        ) : (
          <>
            <div className="scroll-luxe flex-1 overflow-y-auto px-6 py-4">
              <AnimatePresence mode="popLayout">
                {items.map((item) => (
                  <motion.article
                    key={`${item.product.id}-${item.size}-${item.color}`}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.4, ease: EASE_LUXURY }}
                    className="mb-4 flex items-stretch gap-4 rounded-2xl hairline bg-white/55 p-4"
                  >
                    <div className="h-28 w-20 shrink-0 overflow-hidden rounded-xl">
                      <ProductImage
                        gradient={gradientFor(
                          item.product?.colors.find((c) => c.name === item.color)?.gradient ?? "oat"
                        )}
                        silhouette={silhouetteFor(item.product?.category ?? "accessories")}
                        withMark={false}
                        className="h-full w-full"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between py-0.5">
                      <div>
                        <p className="type-eyebrow text-ink-muted">
                          {item.color} · {item.size}
                        </p>
                        <Link
                          to={`/shop/${item.product?.slug}`}
                          onClick={closeSideCart}
                          className="mt-1 block font-display text-base text-ink hover:text-primary"
                        >
                          {item.product?.name}
                        </Link>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 rounded-full hairline bg-canvas/60 px-1">
                          <button
                            onClick={() =>
                              update(item.product.id, item.size, item.color, item.quantity - 1)
                            }
                            className="grid h-7 w-7 place-items-center rounded-full text-ink-soft hover:bg-white/60"
                            aria-label="decrease"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-[1.5rem] text-center text-xs font-medium text-ink">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              update(item.product.id, item.size, item.color, item.quantity + 1)
                            }
                            className="grid h-7 w-7 place-items-center rounded-full text-ink-soft hover:bg-white/60"
                            aria-label="increase"
                          >
                            <Plus className="h-3 w-3" />
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
                        toast.removed(item.product.name);
                      }}
                      className="grid h-8 w-8 shrink-0 place-items-center self-start rounded-full hairline text-ink-soft hover:bg-white/60 hover:text-ink"
                      aria-label="remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </motion.article>
                ))}
              </AnimatePresence>

              {/* Recommended upsell */}
              <div className="mt-8 rounded-2xl hairline bg-white/55 p-5">
                <p className="type-eyebrow text-ink-muted">Worn with</p>
                <p className="mt-2 text-sm text-ink-soft">
                  Three gentle pairings our atelier recommends.
                </p>
                <ul className="mt-4 space-y-2">
                  {recommended
                    .map((id) => getProductByIdFromList(liveProducts, id))
                    .filter((p): p is NonNullable<typeof p> => Boolean(p))
                    .map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-3 rounded-xl bg-canvas/60 p-2.5"
                      >
                        <div className="h-12 w-10 overflow-hidden rounded-lg">
                          <ProductImage
                            gradient={gradientFor(p.colors[0].gradient)}
                            silhouette={silhouetteFor(p.category)}
                            withMark={false}
                            className="h-full w-full"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-ink">{p.name}</p>
                          <p className="text-[11px] text-ink-muted">
                            {formatPrice(p.price)}
                          </p>
                        </div>
                        <Link
                          to={`/shop/${p.slug}`}
                          onClick={closeSideCart}
                          className="text-[10px] uppercase tracking-[0.18em] text-ink-soft hover:text-ink"
                        >
                          Add
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-edge/60 bg-canvas-soft/70 px-6 py-5 backdrop-blur-xl">
              <CouponForm
                applied={applied}
                onApply={apply}
                onRemove={removeCoupon}
              />
              <GiftNoteInline />

              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex items-baseline justify-between">
                  <dt className="text-ink-soft">Subtotal</dt>
                  <dd className="type-caption text-ink">
                    {formatPrice(subtotal, true)}
                  </dd>
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
                    {shipping === 0 ? "Complimentary" : formatPrice(shipping, true)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-edge/60 pt-3">
                  <dt className="font-display text-lg text-ink">Total</dt>
                  <dd className="font-display text-lg type-caption text-ink">
                    {formatPrice(total, true)}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 grid gap-2">
                <Link
                  to="/checkout"
                  onClick={closeSideCart}
                  className="flex w-full items-center justify-center rounded-full bg-ink px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  to="/cart"
                  onClick={closeSideCart}
                  className="flex w-full items-center justify-center rounded-full hairline px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink hover:bg-white/60"
                >
                  View Full Bag
                </Link>
              </div>
              <p className="mt-2 text-center text-[11px] text-ink-muted">
                Encrypted end-to-end. Free returns within 30 days.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function EmptyBag({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-20 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full hairline bg-white/50">
        <ShoppingBag className="h-5 w-5 text-ink" />
      </span>
      <p className="mt-6 font-display text-2xl text-ink">Quiet, for now.</p>
      <p className="mt-2 max-w-[260px] text-sm text-ink-soft">
        Your bag is currently empty. Begin with the season's newly considered pieces.
      </p>
      <Link
        to="/shop"
        onClick={onClose}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
      >
        Browse Catalogue
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function CouponForm({
  onApply,
  onRemove,
  applied,
}: {
  onApply: (code: string) => ReturnType<typeof useCoupon>["applied"];
  onRemove: () => void;
  applied: ReturnType<typeof useCoupon>["applied"];
}) {
  const [code, setCode] = useState(applied?.code ?? "");
  return (
    <div className="flex items-center gap-2 hairline rounded-full bg-canvas/60 px-3 py-1.5">
      <Tag className="h-3.5 w-3.5 text-ink-muted" />
      {applied ? (
        <>
          <span className="flex-1 text-sm font-medium text-ink">
            {applied.code} · −{Math.round(applied.percentOff * 100)}%
          </span>
          <button
            onClick={() => {
              onRemove();
              toast.coupon.removed();
              setCode("");
            }}
            className="text-[10px] uppercase tracking-[0.18em] text-ink-soft hover:text-ink"
          >
            Remove
          </button>
        </>
      ) : (
        <>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Promo code (try WELCOME10)"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
          />
          <button
            onClick={() => {
              const result = onApply(code);
              if (result) toast.coupon.applied(result.code);
              else toast.coupon.invalid();
            }}
            className="rounded-full bg-ink px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
          >
            Apply
          </button>
        </>
      )}
    </div>
  );
}

function GiftNoteInline() {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  return (
    <div className="mt-3 rounded-2xl hairline bg-canvas/60">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink">
          <Gift className="h-3.5 w-3.5" />
          Gift note
        </span>
        <span className="text-[11px] text-ink-muted">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A short note — printed on ÆON letterpress in faint graphite."
            rows={3}
            className={cn(
              "mt-2 w-full resize-none rounded-xl bg-white/60 px-3 py-2 text-sm text-ink placeholder:text-ink-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary"
            )}
          />
          <p className="mt-2 text-[11px] text-ink-muted">
            Hand-set in our atelier. Single 80-character note included.
          </p>
        </div>
      )}
    </div>
  );
}
