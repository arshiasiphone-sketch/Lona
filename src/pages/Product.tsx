import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ChevronRight,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  Repeat,
} from "lucide-react";
import { motion } from "framer-motion";
import { useProduct } from "@/lib/data/catalog";
import { ProductGallery } from "@/components/product/ProductGallery";
import { VariantPicker } from "@/components/product/VariantPicker";
import { BundleSuggestions } from "@/components/product/BundleSuggestions";
import { ShippingEstimator } from "@/components/product/ShippingEstimator";
import { RecentlyViewed } from "@/components/global/RecentlyViewed";
import { Reveal } from "@/components/motion/Reveal";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { formatPrice } from "@/lib/format";

export default function Product() {
  const { slug = "" } = useParams();
  const product = useProduct(slug) ?? null;

  const [color, setColor] = useState(product?.colors[0].id ?? "");
  const [size, setSize] = useState(product?.sizes[0].id ?? "");
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState<string | null>("composition");

  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const { track } = useRecentlyViewed();

  // Track this product as recently viewed on mount.
  useEffect(() => {
    if (product) track(product.id);
  }, [product?.id, track, product]);

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-6 pt-32 pb-24 text-center">
        <p className="font-display text-3xl text-ink">
          This piece is no longer in rotation.
        </p>
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
  const selectedColorGradient = product.colors.find((c) => c.id === color)?.gradient ?? "oat";

  const handleAdd = () => {
    const currentColor = product.colors.find((c) => c.id === color) ?? product.colors[0];
    const currentSize = product.sizes.find((s) => s.id === size) ?? product.sizes[0];
    add({
      productId: product.id,
      size: currentSize.label,
      color: currentColor.name,
      quantity: qty,
    });
    toast.added(`${product.name} · ${currentColor.name} · ${currentSize.label}`);
  };

  return (
    <div className="mx-auto max-w-[1728px] px-6 pt-12 pb-24 lg:px-10 lg:pt-20">
      {/* Breadcrumb */}
      <nav
        aria-label="breadcrumb"
        className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-ink-muted"
      >
        <Link to="/" className="hover:text-ink">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/shop" className="hover:text-ink">
          Shop
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink">{product.name}</span>
      </nav>

      {/* Layout */}
      <div className="mt-8 grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
        <ProductGallery product={product} colorGradient={selectedColorGradient} />

        <div className="lg:sticky lg:top-32 lg:h-fit">
          {/* Header */}
          <div>
            <p className="type-eyebrow text-ink-muted">
              {product.collection.replace("-", " · ")} ·{" "}
              {product.badges?.includes("editorial") && "Editor's pick · "}
              {product.badges?.includes("limited") && "Limited run · "}
              {product.colors.find((c) => c.id === color)?.name}
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

          {/* Variants */}
          <motion.div
            key={`${color}-${size}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE_LUXURY }}
            className="mt-10 space-y-7"
          >
            <VariantPicker
              product={product}
              selectedColor={color}
              selectedSize={size}
              onColorChange={setColor}
              onSizeChange={setSize}
            />
          </motion.div>

          {/* Quantity + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_LUXURY, delay: 0.05 }}
            className="mt-9 flex items-center gap-3"
          >
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
                onClick={() => setQty((q) => mathSafeInc(q))}
                className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-white/60"
                aria-label="increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleAdd}
              className={cn(
                "flex flex-1 items-center justify-center gap-3 rounded-full px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] transition",
                "bg-ink text-canvas hover:bg-primary"
              )}
            >
              <ShoppingBag className="h-4 w-4" />
              Add to bag · {formatPrice(product.price * qty)}
            </motion.button>
            <button
              onClick={() => {
                toggle(product.id);
                favorite ? toast.unwished(product.name) : toast.wished(product.name);
              }}
              className={cn(
                "grid h-12 w-12 place-items-center rounded-full glass transition hover:bg-white/60",
                favorite && "text-primary"
              )}
              aria-label={favorite ? "Remove from wishlist" : "Save to wishlist"}
            >
              <Heart className={cn("h-4 w-4", favorite && "fill-primary")} />
            </button>
          </motion.div>

          {/* Trust signals */}
          <ul className="mt-6 grid gap-2 text-xs text-ink-muted">
            <li className="flex items-center gap-2">
              <Truck className="h-3.5 w-3.5" />
              Complimentary express shipping over $300.
            </li>
            <li className="flex items-center gap-2">
              <Repeat className="h-3.5 w-3.5" />
              30-day easy returns. Made-to-order pieces excluded.
            </li>
          </ul>

          {/* Shipping estimator (collapsed by default) */}
          <details className="mt-8 group rounded-2xl hairline bg-white/45 p-1">
            <summary className="flex cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-ink transition hover:bg-white/60 [&::-webkit-details-marker]:hidden">
              Estimate shipping & duties
              <span className="text-ink-muted transition group-open:rotate-45">+</span>
            </summary>
            <div className="px-4 pb-4">
              <ShippingEstimator />
            </div>
          </details>

          {/* Accordions */}
          <div className="mt-12 divide-y divide-edge/60 border-y border-edge/60">
            {[
              { id: "composition", label: "Composition", body: product.composition },
              { id: "origin", label: "Origin", body: product.origin },
              {
                id: "care",
                label: "Garment Care",
                body:
                  "Dry clean only. Rest between wears on a cedar hanger. Press lightly with a damp cloth between seasons.",
              },
              {
                id: "returns",
                label: "Returns & Repairs",
                body:
                  "Ships within 48 hours from Milan or Kyoto. Returns accepted within 30 days, items unworn, in original packaging. Lifetime repair at our atelier.",
              },
            ].map((item) => (
              <div key={item.id}>
                <button
                  onClick={() =>
                    setOpen((curr) => (curr === item.id ? null : item.id))
                  }
                  className="flex w-full items-center justify-between py-5 text-left text-sm font-medium text-ink"
                  aria-expanded={open === item.id}
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
                  animate={{
                    height: open === item.id ? "auto" : 0,
                    opacity: open === item.id ? 1 : 0,
                  }}
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

      {/* Bundle suggestions */}
      <BundleSuggestions primaryId={product.id} />

      {/* Recently viewed */}
      <RecentlyViewed excludeId={product.id} />

      {/* Editorial cross-promo */}
      <Reveal as="section" className="mt-32">
        <div className="grid items-center gap-8 rounded-3xl glass-strong p-10 lg:grid-cols-[1.2fr_1fr] lg:p-14">
          <div>
            <p className="type-eyebrow text-ink-muted">Editor's note</p>
            <h3 className="mt-3 font-display text-3xl leading-tight text-ink lg:text-4xl">
              How we put this together
            </h3>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
              Three weeks at the Florence mill, two with the tailor, the rest
              with the cloth. The making of a single piece at ÆON is closer to
              editing a manuscript than manufacturing.
            </p>
            <Link
              to="/press/the-patination-of-leather"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
            >
              Read the journal
            </Link>
          </div>
          <div className="gradient-oat relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-inset ring-white/40">
            <div className="absolute inset-0 grid place-items-center text-ink/40">
              <p className="font-display text-3xl">From the Atelier</p>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function mathSafeInc(n: number): number {
  return n + 1;
}
