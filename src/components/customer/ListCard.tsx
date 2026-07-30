import { Link } from "react-router";
import { Heart, Plus } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/data/catalog";
import { ProductImage } from "@/components/ui/ProductImage";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { formatDiscount, formatPrice } from "@/lib/format";

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

interface ListCardProps {
  product: Product;
}

export function ListCard({ product }: ListCardProps) {
  const { has, toggle } = useWishlist();
  const { add } = useCart();
  const favorite = has(product.id);
  const discount = formatDiscount(product.price, product.compareAt);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: EASE_LUXURY }}
      className="grid grid-cols-[112px_1fr] gap-5 rounded-2xl hairline bg-white/45 p-4 sm:grid-cols-[160px_1fr] sm:gap-8 sm:p-6"
    >
      <Link
        to={`/shop/${product.slug}`}
        className="block overflow-hidden rounded-xl"
      >
        <div className="relative aspect-[4/5] w-full">
          <ProductImage
            gradient={product.colors[0].gradient}
            silhouette={silhouetteFor(product.category)}
            withMark={false}
            className="h-full w-full"
          />
          {discount && (
            <span className="absolute left-2 top-2 rounded-full bg-ink/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-canvas">
              {discount}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="type-eyebrow text-ink-muted">
              {product.collection.replace("-", " · ")} · {product.colors[0].name}
            </p>
            <Link
              to={`/shop/${product.slug}`}
              className="mt-1 block font-display text-2xl leading-tight text-ink hover:text-primary"
            >
              {product.name}
            </Link>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-base text-ink type-caption">
                {formatPrice(product.price)}
              </span>
              {product.compareAt && (
                <span className="text-sm text-ink-muted line-through type-caption">
                  {formatPrice(product.compareAt)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggle(product.id)}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-full hairline transition hover:bg-white",
                favorite && "text-primary"
              )}
              aria-label={favorite ? "Remove from wishlist" : "Save to wishlist"}
            >
              <Heart className={cn("h-4 w-4", favorite && "fill-primary")} />
            </button>
            <button
              onClick={() => {
                add({
                  productId: product.id,
                  size: product.sizes[0].label,
                  color: product.colors[0].name,
                  quantity: 1,
                });
                toast.added(product.name);
              }}
              className="grid h-9 w-9 place-items-center rounded-full bg-ink text-canvas transition hover:bg-primary"
              aria-label="افزودن به سبد خرید"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="mt-3 hidden text-sm leading-relaxed text-ink-soft sm:block sm:line-clamp-2">
          {product.description}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="type-eyebrow text-ink-muted">ترکیب</p>
            <p className="mt-1 text-ink-soft">{product.composition}</p>
          </div>
          <div>
            <p className="type-eyebrow text-ink-muted">کشور سازنده</p>
            <p className="mt-1 text-ink-soft">{product.origin}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-ink-muted">
          <span>موجود</span>
          <div className="flex flex-wrap gap-1.5">
            {product.sizes.map((s) => (
              <span
                key={s.id}
                className="rounded-md hairline bg-canvas/60 px-2 py-0.5 text-ink-soft"
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
