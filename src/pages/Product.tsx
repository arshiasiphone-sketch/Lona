import { useState } from "react";
import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  Repeat,
} from "lucide-react";
import { getProduct } from "@/data/catalog";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { products } from "@/data/catalog";
import { Reveal } from "@/components/motion/Reveal";
import { ProductCard } from "@/components/product/ProductCard";

export default function Product() {
  const { slug = "" } = useParams();
  const product = getProduct(slug);

  const [color, setColor] = useState(product?.colors[0].id ?? "");
  const [size, setSize] = useState(product?.sizes[0].id ?? "");
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState<string | null>("composition");
  const [added, setAdded] = useState(false);

  const { add } = useCart();
  const { has, toggle } = useWishlist();

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-6 pt-32 pb-24 text-center">
        <p className="font-display text-3xl text-ink">This piece is no longer in rotation.</p>
        <Link
          to="/shop"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          View Catalogue
        </Link>
      </div>
    );
  }

  const favorite = has(product.id);
  const currentColor = product.colors.find((c) => c.id === color) ?? product.colors[0];
  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAdd = () => {
    add({
      productId: product.id,
      size: product.sizes.find((s) => s.id === size)?.label ?? "",
      color: currentColor.name,
      quantity: qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div className="mx-auto max-w-[1728px] px-6 pt-12 pb-24 lg:px-10 lg:pt-20">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-ink-muted">
        <Link to="/" className="hover:text-ink">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/shop" className="hover:text-ink">Shop</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink">{product.name}</span>
      </nav>

      {/* Layout */}
      <div className="mt-8 grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        {/* Gallery */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: EASE_LUXURY }}
            className="overflow-hidden rounded-3xl"
          >
            <ProductImage
              gradient={
                currentColor.gradient === "oat"
                  ? "gradient-oat"
                  : currentColor.gradient === "mist"
                  ? "gradient-mist"
                  : currentColor.gradient === "rose"
                  ? "gradient-rose-quartz"
                  : "gradient-deep"
              }
              silhouette={
                product.category === "outerwear"
                  ? "coat"
                  : product.category === "knitwear"
                  ? "knit"
                  : product.category === "dresses"
                  ? "dress"
                  : product.category === "trousers"
                  ? "trouser"
                  : product.category === "shirting"
                  ? "shirt"
                  : product.category === "leather"
                  ? "leather"
                  : "accessory"
              }
              withMark
              className="aspect-[4/5] w-full"
            />
          </motion.div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl ring-1 ring-inset ring-edge/40">
                <ProductImage
                  gradient={
                    (i % 4 === 1 ? "mist" : i % 4 === 2 ? "rose" : i % 4 === 3 ? "deep" : "oat")
                  }
                  silhouette={
                    product.category === "outerwear"
                      ? "coat"
                      : product.category === "knitwear"
                      ? "knit"
                      : product.category === "dresses"
                      ? "dress"
                      : product.category === "trousers"
                      ? "trouser"
                      : product.category === "shirting"
                      ? "shirt"
                      : product.category === "leather"
                      ? "leather"
                      : "accessory"
                  }
                  withMark={false}
                  className="aspect-[4/5] w-full"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="lg:sticky lg:top-32 lg:h-fit">
          {/* Header */}
          <div>
            <p className="type-eyebrow text-ink-muted">
              {currentColor.name} · {product.collection.replace("-", " — ")}
            </p>
            <h1 className="mt-4 font-display text-4xl leading-[1.05] text-ink lg:text-5xl">
              {product.name}
            </h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-xl text-ink type-caption">
                {formatPrice(product.price)}
              </span>
              {product.compareAt && (
                <span className="text-sm text-ink-muted line-through type-caption">
                  {formatPrice(product.compareAt)}
                </span>
              )}
            </div>
            {product.rating !== undefined && (
              <p className="mt-2 text-xs text-ink-muted">
                {product.rating.toFixed(1)} · {product.reviewCount} reviews
              </p>
            )}
          </div>

          <p className="mt-8 text-sm leading-relaxed text-ink-soft">
            {product.description}
          </p>

          {/* Color */}
          <div className="mt-10">
            <p className="type-eyebrow text-ink-muted">Color · {currentColor.name}</p>
            <div className="mt-3 flex gap-3">
              {product.colors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  className={cn(
                    "relative h-11 w-11 rounded-full",
                    c.gradient === "oat" && "gradient-oat",
                    c.gradient === "mist" && "gradient-mist",
                    c.gradient === "deep" && "gradient-deep",
                    c.gradient === "rose" && "gradient-rose-quartz"
                  )}
                  aria-label={c.name}
                >
                  <span
                    className={cn(
                      "absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-canvas transition",
                      color === c.id ? "ring-ink" : "ring-transparent"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <p className="type-eyebrow text-ink-muted">Size</p>
              <button className="text-xs uppercase tracking-[0.18em] text-ink-soft underline-offset-4 hover:underline">
                Size guide
              </button>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSize(s.id)}
                  className={cn(
                    "rounded-xl py-2.5 text-[11px] uppercase tracking-[0.18em] transition",
                    size === s.id
                      ? "bg-ink text-canvas"
                      : "hairline text-ink-soft hover:bg-white/60 hover:text-ink"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + CTA */}
          <div className="mt-10 flex items-center gap-3">
            <div className="glass flex items-center rounded-full px-1 py-1">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-white/60"
                aria-label="decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[2rem] text-center text-sm font-medium text-ink">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-white/60"
                aria-label="increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={handleAdd}
              className={cn(
                "flex flex-1 items-center justify-center gap-3 rounded-full px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] transition",
                added
                  ? "bg-primary text-primary-foreground"
                  : "bg-ink text-canvas hover:bg-primary"
              )}
            >
              <ShoppingBag className="h-4 w-4" />
              {added ? "Added to bag" : "Add to bag"}
            </button>
            <button
              onClick={() => toggle(product.id)}
              className={cn(
                "grid h-12 w-12 place-items-center rounded-full glass transition hover:bg-white/60",
                favorite && "text-primary"
              )}
              aria-label="wishlist"
            >
              <Heart className={cn("h-4 w-4", favorite && "fill-primary")} />
            </button>
          </div>

          {/* Trust signals */}
          <div className="mt-6 grid gap-3 text-xs text-ink-muted">
            <p className="flex items-center gap-2">
              <Truck className="h-3.5 w-3.5" />
              Complimentary express shipping over $300.
            </p>
            <p className="flex items-center gap-2">
              <Repeat className="h-3.5 w-3.5" />
              30-day easy returns. Made-to-order pieces excluded.
            </p>
          </div>

          {/* Accordions */}
          <div className="mt-12 divide-y divide-edge/60 border-y border-edge/60">
            {[
              {
                id: "composition",
                label: "Composition",
                body: product.composition,
              },
              {
                id: "origin",
                label: "Origin",
                body: product.origin,
              },
              {
                id: "care",
                label: "Garment Care",
                body:
                  "Dry clean only. Rest between wears on a cedar hanger. Press lightly with a damp cloth between seasons.",
              },
              {
                id: "shipping",
                label: "Shipping & Returns",
                body:
                  "Ships within 48 hours from Milan or Kyoto. Returns accepted within 30 days, items unworn, in original packaging.",
              },
            ].map((item) => (
              <div key={item.id}>
                <button
                  onClick={() =>
                    setOpen((curr) => (curr === item.id ? null : item.id))
                  }
                  className="flex w-full items-center justify-between py-5 text-left text-sm font-medium text-ink"
                >
                  {item.label}
                  <Plus
                    className={cn(
                      "h-4 w-4 transition",
                      open === item.id && "rotate-45"
                    )}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: open === item.id ? "auto" : 0, opacity: open === item.id ? 1 : 0 }}
                  transition={{ duration: 0.32, ease: EASE_LUXURY }}
                  className="overflow-hidden"
                >
                  <p className="pb-5 text-sm leading-relaxed text-ink-soft">
                    {item.body}
                  </p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related */}
      <Reveal as="section" className="mt-32">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl text-ink lg:text-4xl">
            Considered with
          </h2>
          <Link
            to="/shop"
            className="text-[11px] uppercase tracking-[0.18em] text-ink-soft hover:text-ink"
          >
            View all
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 sm:gap-x-8 sm:gap-y-16 lg:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Reveal>
    </div>
  );
}
