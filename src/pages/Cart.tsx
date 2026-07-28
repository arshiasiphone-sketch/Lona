import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { getProductById } from "@/data/catalog";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { formatPrice } from "@/lib/format";

const silhouetteForCategory = (cat: string) => {
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

export default function Cart() {
  const { lines, update, remove, clear } = useCart();

  const items = lines
    .map((line) => {
      const product = getProductById(line.productId);
      return product ? { ...line, product } : null;
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shipping = items.length > 0 ? (subtotal > 300 ? 0 : 18) : 0;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 pt-28 pb-24 text-center lg:px-10">
        <p className="type-eyebrow text-ink-muted">Bag</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-6xl">
          Quiet, for now.
        </h1>
        <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-ink-soft">
          Your bag is currently empty. Begin with the season's newly considered pieces.
        </p>
        <Link
          to="/shop"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          View Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1728px] px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <header className="flex items-end justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">Bag</p>
          <h1 className="mt-3 font-display text-4xl text-ink lg:text-6xl">
            Your selection
          </h1>
        </div>
        <button
          onClick={clear}
          className="text-[11px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink"
        >
          Clear bag
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
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4, ease: EASE_LUXURY }}
                className="glass flex items-stretch gap-4 rounded-2xl p-4"
              >
                <div className="h-32 w-24 shrink-0 overflow-hidden rounded-xl sm:h-40 sm:w-32">
                  <ProductImage
                    gradient={
                      item.product.colors.find((c) => c.name === item.color)?.gradient === "oat"
                        ? "gradient-oat"
                        : item.product.colors.find((c) => c.name === item.color)?.gradient === "mist"
                        ? "gradient-mist"
                        : item.product.colors.find((c) => c.name === item.color)?.gradient === "rose"
                        ? "gradient-rose-quartz"
                        : "gradient-deep"
                    }
                    silhouette={silhouetteForCategory(item.product.category)}
                    withMark={false}
                    className="h-full w-full"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between py-1">
                  <div>
                    <p className="type-eyebrow text-ink-muted">
                      {item.color} · {item.size}
                    </p>
                    <Link
                      to={`/shop/${item.product.slug}`}
                      className="mt-1 font-display text-lg text-ink hover:text-primary"
                    >
                      {item.product.name}
                    </Link>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="glass flex items-center rounded-full px-1">
                      <button
                        onClick={() =>
                          update(item.product.id, item.size, item.color, item.quantity - 1)
                        }
                        className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-white/60"
                        aria-label="decrease"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[1.5rem] text-center text-xs font-medium text-ink">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          update(item.product.id, item.size, item.color, item.quantity + 1)
                        }
                        className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-white/60"
                        aria-label="increase"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm text-ink type-caption">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => remove(item.product.id, item.size, item.color)}
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full hairline text-ink-soft hover:bg-white/60 hover:text-ink"
                  )}
                  aria-label="remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-32 lg:h-fit">
          <div className="glass-strong rounded-3xl p-8">
            <p className="type-eyebrow text-ink-muted">Summary</p>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex items-baseline justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="text-ink type-caption">{formatPrice(subtotal, true)}</dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-ink-soft">Shipping</dt>
                <dd className="text-ink type-caption">
                  {shipping === 0 ? "Complimentary" : formatPrice(shipping, true)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between">
                <dt className="text-ink-soft">Duties</dt>
                <dd className="text-ink-muted">At next step</dd>
              </div>
              <div className="h-px bg-edge/70" />
              <div className="flex items-baseline justify-between">
                <dt className="font-display text-xl text-ink">Total</dt>
                <dd className="font-display text-xl text-ink type-caption">
                  {formatPrice(total, true)}
                </dd>
              </div>
            </dl>
            <Link
              to="/checkout"
              className="mt-8 flex w-full items-center justify-center rounded-full bg-ink px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary"
            >
              Proceed to Checkout
            </Link>
            <p className="mt-4 text-center text-xs text-ink-muted">
              Secure checkout. Encrypted end-to-end.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
