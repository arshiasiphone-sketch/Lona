import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCart } from "@/hooks/use-cart";
import { useProducts, getProductByIdFromList } from "@/lib/data/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";

export default function Wishlist() {
  const { ids, remove, clear } = useWishlist();
  const { add } = useCart();
  const liveProducts = useProducts();

  const items = ids
    .map((id) => getProductByIdFromList(liveProducts, id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="mx-auto max-w-[1728px] px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <header className="flex items-end justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">علاقه‌مندی‌ها</p>
          <h1 className="mt-3 font-display text-4xl text-ink lg:text-6xl">
            فهرست دلخواه شما
          </h1>
        </div>
        {items.length > 0 && (
          <button
            onClick={clear}
            className="text-[11px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink"
          >
            پاک کردن همه
          </button>
        )}
      </header>

      {items.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-display text-3xl text-ink lg:text-4xl">
            هنوز محصولی ذخیره نکرده‌اید.
          </p>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
            برای نگه‌داشتن محصولات در این فهرست، روی آیکون قلب کلیک کنید. موارد ذخیره‌شده
            تا ۹۰ روز در دسترس شما هستند.
          </p>
          <Link
            to="/shop"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
          >
            مشاهده کالکسیون
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 sm:gap-x-8 sm:gap-y-16 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {items.map((product, i) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: EASE_LUXURY, delay: i * 0.04 }}
                className="relative"
              >
                <ProductCard product={product} />
                <div className="absolute left-1 top-1">
                  <button
                    onClick={() => remove(product.id)}
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-full glass-subtle text-ink-soft hover:bg-white hover:text-ink"
                    )}
                    aria-label="حذف از علاقه‌مندی‌ها"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={() =>
                    add({
                      productId: product.id,
                      size: product.sizes[0].label,
                      color: product.colors[0].name,
                      quantity: 1,
                    })
                  }
                  className="mt-4 w-full rounded-full hairline px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-ink-soft transition hover:bg-ink hover:text-canvas"
                >
                  انتقال به سبد
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
