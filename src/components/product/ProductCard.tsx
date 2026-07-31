/**
 * Lona — refined product card.
 *
 * Hover language:
 *   - Scale 1.02 (gentle, not 1.06)
 *   - Secondary image / gradient fades in with soft-blur backdrop
 *   - Subtle gold ring glow on hover
 *   - Soft shadow, not floating
 *   - No MagneticHover (eliminates bouncy parallax jitter)
 *
 * RTL: badges sit on the top-start corner (right in RTL via `start-3`),
 * quick-add sits on the bottom edge with `inset-x-3`.
 */
import { motion } from "framer-motion";
import { Link } from "react-router";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product as TProduct } from "@/data/catalog";
import { ProductImage } from "@/components/ui/ProductImage";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/glass";
import { EASE_LUXURY, SPRING_GENTLE } from "@/lib/motion";
import { formatDiscount, formatPrice } from "@/lib/format";
import { toast } from "@/lib/toast";

const SILHOUETTE_MAP: Record<
  TProduct["category"],
  "bra" | "brief" | "robe" | "tee" | "bodysuit" | "accessory"
> = {
  bras: "bra",
  briefs: "brief",
  sets: "bra",
  sleepwear: "robe",
  loungewear: "robe",
  bodysuits: "bodysuit",
  shapewear: "bodysuit",
  sportswear: "tee",
  accessories: "accessory",
  bridal: "bra",
};

const gradientClass = (k: TProduct["colors"][number]["gradient"]) => {
  switch (k) {
    case "oat":
      return "gradient-oat";
    case "mist":
      return "gradient-mist";
    case "deep":
      return "gradient-deep";
    case "rose":
      return "gradient-rose-quartz";
    case "blush":
      return "gradient-lona-rose";
    case "pearl":
      return "gradient-lona-pearl";
    case "noir":
      return "gradient-lona-noir";
    default:
      return "gradient-oat";
  }
};

interface ProductCardProps {
  product: TProduct;
  priority?: boolean;
  className?: string;
}

const HOVER_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export function ProductCard({ product, priority, className }: ProductCardProps) {
  const { has, toggle } = useWishlist();
  const { add } = useCart();
  const favorite = has(product.id);
  const primary = product.colors[0];
  const secondary = product.colors[1] ?? primary;
  const discount = formatDiscount(product.price, product.compareAt);
  // Phase 5.8.1 — real photo URLs from the live catalog layer; falls back to silhouette if missing.
  const primaryImage = product.imageUrls?.[0];
  const hoverImage = product.imageUrls?.[1] ?? primaryImage;

  const handleQuickAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    add({
      productId: product.id,
      size: product.sizes[0].label,
      color: product.colors[0].name,
      quantity: 1,
    });
    const card = e.currentTarget.closest(
      "[data-product-card]"
    ) as HTMLElement | null;
    if (card) {
      const rect = card.getBoundingClientRect();
      window.dispatchEvent(
        new CustomEvent("aeon:fly-to-bag", {
          detail: {
            id: `${product.id}-${Date.now()}`,
            image: "",
            label: product.name,
            from: {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
            },
            to: { x: window.innerWidth - 60, y: 60 },
          },
        })
      );
    }
    toast.added(product.name);
  };

  return (
    <motion.article
      data-product-card
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: EASE_LUXURY, delay: priority ? 0 : 0.04 }}
      className={cn("group relative flex flex-col gap-4", className)}
    >
      <Link
        to={`/shop/${product.slug}`}
        className="focus-luxury relative block overflow-hidden rounded-2xl bg-canvas"
        aria-label={product.name}
      >
        <motion.div
          layoutId={`product-${product.slug}`}
          transition={SPRING_GENTLE}
          className="relative aspect-[4/5] w-full"
        >
          {/* Plate — gentle scale 1.02 on hover, no bounce */}
          <div
            className={cn(
              "absolute inset-0 transition-transform duration-[1100ms]",
              "ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]"
            )}
            style={{ transitionTimingFunction: HOVER_EASE }}
          >
            <ProductImage
              gradient={gradientClass(primary.gradient).replace("gradient-", "") as TProduct["colors"][number]["gradient"]}
              silhouette={SILHOUETTE_MAP[product.category]}
              src={primaryImage}
              alt={product.name}
              withMark={false}
              className="absolute inset-0 [&>div.rounded-xl]:rounded-none [&_img]:transition-opacity [&_img]:duration-700"
              priority={priority}
            />

            {/* Hover layer — secondary image with gentle fade + soft blur */}
            {hoverImage && hoverImage !== primaryImage ? (
              <div
                className={cn(
                  "absolute inset-0 opacity-0 transition-opacity duration-[700ms] group-hover:opacity-100"
                )}
                style={{ transitionTimingFunction: HOVER_EASE }}
              >
                <ProductImage
                  gradient={gradientClass((product.secondaryGradient ?? secondary.gradient) as TProduct["colors"][number]["gradient"]).replace("gradient-", "") as TProduct["colors"][number]["gradient"]}
                  silhouette={SILHOUETTE_MAP[product.category]}
                  src={hoverImage}
                  alt={product.name}
                  withMark={false}
                  className="absolute inset-0 [&>div.rounded-xl]:rounded-none"
                />
              </div>
            ) : product.secondaryGradient ? (
              <div
                className={cn(
                  "absolute inset-0 opacity-0 transition-opacity duration-[700ms] backdrop-blur-[2px] group-hover:opacity-100",
                  gradientClass(product.secondaryGradient)
                )}
                style={{ transitionTimingFunction: HOVER_EASE }}
              >
                <div className="absolute inset-0 grid place-items-center text-ink/55">
                  <SilhouetteBlock category={product.category} />
                </div>
              </div>
            ) : null}
          </div>

          {/* Soft edge + subtle gold glow on hover */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/[0.04]",
              "transition-all duration-700 group-hover:ring-[1.5px] group-hover:ring-[oklch(0.78_0.08_75/0.18)] group-hover:shadow-[0_8px_28px_oklch(0.32_0.03_30/0.05)]"
            )}
          />

          {/* Badges — top-start (right in RTL) */}
          <div className="pointer-events-none absolute right-3 top-3 flex flex-col gap-1.5">
            {product.badges?.includes("new") && (
              <span className="glass-subtle rounded-full px-2.5 py-1 font-sans text-[10px] font-medium tracking-[0.04em] text-ink">
                تازه
              </span>
            )}
            {product.badges?.includes("limited") && (
              <span className="glass-subtle rounded-full px-2.5 py-1 font-sans text-[10px] font-medium tracking-[0.04em] text-primary">
                محدود
              </span>
            )}
            {discount && (
              <span className="rounded-full bg-ink/90 px-2.5 py-1 font-sans text-[10px] font-medium tracking-[0.04em] text-canvas">
                {discount}
              </span>
            )}
          </div>

          {/* Quick actions — glass-subtle, calmer */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-2 items-center gap-2 opacity-0 transition-all duration-500 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={handleQuickAdd}
              className="glass-subtle flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2.5 font-sans text-[11px] font-medium tracking-[0.04em] text-ink transition hover:bg-white/85"
            >
              افزودن به سبد
              <ShoppingBag className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggle(product.id);
                favorite ? toast.unwished(product.name) : toast.wished(product.name);
              }}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-full glass-subtle transition hover:bg-white/85",
                favorite && "text-primary"
              )}
              aria-label={
                favorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"
              }
            >
              <Heart className={cn("h-4 w-4", favorite && "fill-primary")} />
            </button>
          </div>
        </motion.div>
      </Link>

      {/* Meta */}
      <div className="flex flex-col gap-1 px-1">
        <div className="flex items-center justify-between">
          <p className="type-eyebrow text-ink-muted">{secondary.name}</p>
          {product.rating !== undefined && (
            <p className="font-sans text-[11px] tracking-[0.04em] text-ink-muted">
              {product.rating.toFixed(1)} · {product.reviewCount} رأی
            </p>
          )}
        </div>
        <Link
          to={`/shop/${product.slug}`}
          className="font-display text-[17px] font-light leading-snug text-ink transition hover:text-primary"
        >
          {product.name}
        </Link>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-sans text-[15px] text-ink type-caption">
            {formatPrice(product.price)}
          </span>
          {product.compareAt && (
            <span className="font-sans text-sm text-ink-muted line-through type-caption">
              {formatPrice(product.compareAt)}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function SilhouetteBlock({ category }: { category: TProduct["category"] }) {
  const silhouette = SILHOUETTE_MAP[category];
  return (
    <ProductImage
      silhouette={silhouette}
      withMark={false}
      className="absolute inset-0 [&>div]:hidden"
    />
  );
}