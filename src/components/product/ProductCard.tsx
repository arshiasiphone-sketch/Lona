import { motion } from "framer-motion";
import { Link } from "react-router";
import { Heart } from "lucide-react";
import type { Product as TProduct } from "@/data/catalog";
import { ProductImage } from "@/components/ui/ProductImage";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { formatDiscount, formatPrice } from "@/lib/format";

const SILHOUETTE_MAP: Record<TProduct["category"], "coat" | "knit" | "trouser" | "shirt" | "dress" | "leather" | "accessory"> = {
  outerwear: "coat",
  knitwear: "knit",
  trousers: "trouser",
  shirting: "shirt",
  dresses: "dress",
  leather: "leather",
  accessories: "accessory",
};

interface ProductCardProps {
  product: TProduct;
  priority?: boolean;
  className?: string;
}

export function ProductCard({ product, priority, className }: ProductCardProps) {
  const { has, toggle } = useWishlist();
  const { add } = useCart();
  const favorite = has(product.id);
  const primary = product.colors[0];
  const secondary = product.colors[1] ?? primary;

  const discount = formatDiscount(product.price, product.compareAt);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: EASE_LUXURY, delay: priority ? 0 : 0.05 }}
      className={cn("group relative flex flex-col gap-4", className)}
    >
      <Link
        to={`/shop/${product.slug}`}
        className="focus-luxury relative block overflow-hidden rounded-2xl"
        aria-label={product.name}
      >
        <div className="relative aspect-[4/5] w-full">
          {/* Primary image */}
          <motion.div
            initial={{ scale: 1.02 }}
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 1.1, ease: EASE_LUXURY }}
            className={cn(
              "absolute inset-0",
              primary.gradient === "oat" && "gradient-oat",
              primary.gradient === "mist" && "gradient-mist",
              primary.gradient === "deep" && "gradient-deep",
              primary.gradient === "rose" && "gradient-rose-quartz"
            )}
          >
            <div className="absolute inset-0 grid place-items-center text-ink/55">
              <SilhouetteBlock category={product.category} />
            </div>
          </motion.div>
          {/* Reveal image */}
          {product.secondaryGradient && (
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: EASE_LUXURY }}
              className={cn(
                "absolute inset-0",
                product.secondaryGradient === "oat" && "gradient-oat",
                product.secondaryGradient === "mist" && "gradient-mist",
                product.secondaryGradient === "deep" && "gradient-deep",
                product.secondaryGradient === "rose" && "gradient-rose-quartz"
              )}
            >
              <div className="absolute inset-0 grid place-items-center text-ink/55">
                <SilhouetteBlock category={product.category} />
              </div>
            </motion.div>
          )}
          {/* Edge highlight ring */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/45" />
          {/* Badges */}
          <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
            {product.badges?.includes("new") && (
              <span className="glass-subtle rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-ink">
                New
              </span>
            )}
            {product.badges?.includes("limited") && (
              <span className="glass-subtle rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-primary">
                Limited
              </span>
            )}
            {discount && (
              <span className="rounded-full bg-ink/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-canvas">
                {discount}
              </span>
            )}
          </div>
          {/* Quick actions */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-3 items-center gap-2 opacity-0 transition duration-500 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.preventDefault();
                add({
                  productId: product.id,
                  size: product.sizes[0].label,
                  color: product.colors[0].name,
                  quantity: 1,
                });
              }}
              className="glass-strong flex-1 rounded-full px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink transition hover:bg-ink hover:text-canvas"
            >
              Quick add
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle(product.id);
              }}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-full glass-strong transition hover:bg-ink hover:text-canvas",
                favorite && "text-primary"
              )}
              aria-label={favorite ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={cn("h-4 w-4", favorite && "fill-primary")}
              />
            </button>
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-1 px-1">
        <div className="flex items-center justify-between">
          <p className="type-eyebrow text-ink-muted">
            {secondary.name}
          </p>
          {product.rating !== undefined && (
            <p className="text-[11px] tracking-[0.04em] text-ink-muted">
              {product.rating.toFixed(1)} · {product.reviewCount}
            </p>
          )}
        </div>
        <Link
          to={`/shop/${product.slug}`}
          className="font-display text-base leading-snug text-ink transition hover:text-primary"
        >
          {product.name}
        </Link>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-sans text-[15px] text-ink type-caption">
            {formatPrice(product.price)}
          </span>
          {product.compareAt && (
            <span className="text-sm text-ink-muted line-through type-caption">
              {formatPrice(product.compareAt)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/* Sub-component — silhouettes reused from ProductImage via inline drawing */
function SilhouetteBlock({ category }: { category: TProduct["category"] }) {
  const silhouette = SILHOUETTE_MAP[category];
  return <ProductImage silhouette={silhouette} withMark={false} className="absolute inset-0 [&>div]:hidden" />;
}
