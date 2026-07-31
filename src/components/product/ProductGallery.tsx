import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, GripHorizontal } from "lucide-react";
import { ProductImage } from "@/components/ui/ProductImage";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import type { GradientKey } from "@/lib/glass";
import type { Product as TProduct } from "@/data/catalog";

const gradientOf = (k: GradientKey) =>
  k === "oat" ? "gradient-oat" : k === "deep" ? "gradient-deep" : k === "rose" ? "gradient-rose-quartz" : "gradient-mist";

const silhouetteOf = (cat: TProduct["category"]) => {
  switch (cat) {
    case "bras":
      return "bra" as const;
    case "briefs":
      return "brief" as const;
    case "sets":
      return "bra" as const;
    case "sleepwear":
      return "robe" as const;
    case "loungewear":
      return "robe" as const;
    case "bodysuits":
      return "bodysuit" as const;
    case "shapewear":
      return "bodysuit" as const;
    case "sportswear":
      return "tee" as const;
    case "accessories":
      return "accessory" as const;
    case "bridal":
      return "bra" as const;
  }
};

interface ProductGalleryProps {
  product: TProduct;
  /** Currently selected color */
  colorGradient: GradientKey;
}

export function ProductGallery({ product, colorGradient }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(false);

  // Phase 5.8.1 — prefer real photo URLs when the catalog carries them.
  const galleryUrls: (string | undefined)[] =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls.slice(0, 4)
      : [];
  // 4 frame angles for the active color (rotate the cycle through the gradient to imply angle changes).
  const FRAMES = [0, 1, 2, 3];

  return (
    <>
      <div className="space-y-4">
        <motion.div
          key={active}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE_LUXURY }}
          onClick={() => setFullscreen(true)}
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          className={cn(
            "group relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-3xl ring-1 ring-inset ring-white/40"
          )}
        >
          <motion.div
            animate={{ scale: zoom ? 1.06 : 1 }}
            transition={{ duration: 1.0, ease: EASE_LUXURY }}
            className={cn("absolute inset-0", gradientOf(colorGradient))}
          >
            <ProductImage
              gradient={colorGradient}
              silhouette={silhouetteOf(product.category)}
              src={galleryUrls[active]}
              alt={product.name}
              priority
              withMark
              className="h-full w-full [&>div.rounded-xl]:rounded-3xl"
            />
          </motion.div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFullscreen(true);
            }}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full glass-strong text-ink transition hover:bg-ink hover:text-canvas"
            aria-label="باز کردن"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          {/* zoom hint */}
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center opacity-0 transition group-hover:opacity-100">
            <span className="glass rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-ink">
              لمس برای بزرگ‌نمایی
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-4 gap-3">
          {FRAMES.map((frame) => {
            const cycle: GradientKey[] = ["oat", "mist", "rose", "deep"];
            const grad =
              frame === 0
                ? colorGradient
                : cycle[(cycle.indexOf(colorGradient) + frame) % cycle.length];
            const isActive = active === frame;
            const thumbUrl = galleryUrls[frame];
            return (
              <button
                key={frame}
                onClick={() => setActive(frame)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-xl ring-1 ring-inset ring-white/40 transition",
                  isActive && "ring-2 ring-ink"
                )}
                aria-label={`نمای تصویر ${frame + 1}`}
              >
                <div className={cn("absolute inset-0", gradientOf(grad))}>
                  <ProductImage
                    gradient={grad}
                    silhouette={silhouetteOf(product.category)}
                    src={thumbUrl}
                    alt={`${product.name} — نمای ${frame + 1}`}
                    withMark={false}
                    className="h-full w-full [&>div.rounded-xl]:rounded-xl"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={fullscreen} onOpenChange={(o) => !o && setFullscreen(false)}>
        <DialogContent
          className="fixed inset-0 !max-w-none !w-screen !h-screen !translate-x-0 !translate-y-0 !rounded-none !border-0 !bg-ink/95 !p-0"
        >
          <div className="flex h-full flex-col text-canvas">
            <div className="flex items-center justify-between px-6 py-5">
              <div>
                <DialogTitle className="font-display text-2xl">
                  {product.name}
                </DialogTitle>
                <DialogDescription className="text-sm text-canvas/70">
                  {product.collection.replace("-", " ")} · {product.colors.length} colorways
                </DialogDescription>
              </div>
              <button
                onClick={() => setFullscreen(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-canvas/30 text-canvas transition hover:bg-canvas/10"
                aria-label="بستن"
              >
                ✕
              </button>
            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-hidden p-8 lg:p-16">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04 }}
                  transition={{ duration: 0.4, ease: EASE_LUXURY }}
                  className={cn(
                    "relative aspect-[4/5] h-full max-h-[80vh] w-auto overflow-hidden rounded-3xl",
                    gradientOf(colorGradient)
                  )}
                >
                  <ProductImage
                    gradient={colorGradient}
                    silhouette={silhouetteOf(product.category)}
                    src={galleryUrls[active]}
                    alt={`${product.name} — نمای ${active + 1}`}
                    priority
                    withMark={false}
                    className="h-full w-full [&>div.rounded-xl]:rounded-3xl"
                  />
                </motion.div>
              </AnimatePresence>
              <button
                onClick={() => setActive((a) => (a === 0 ? FRAMES.length - 1 : a - 1))}
                className="absolute left-6 grid h-12 w-12 place-items-center rounded-full bg-canvas/15 text-canvas backdrop-blur-md transition hover:bg-canvas/25"
                aria-label="تصویر قبلی"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setActive((a) => (a + 1) % FRAMES.length)}
                className="absolute right-6 grid h-12 w-12 place-items-center rounded-full bg-canvas/15 text-canvas backdrop-blur-md transition hover:bg-canvas/25"
                aria-label="تصویر بعدی"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-3 px-6 py-6">
              {FRAMES.map((f) => (
                <button
                  key={f}
                  onClick={() => setActive(f)}
                  className={cn(
                    "h-2 w-8 rounded-full transition",
                    f === active ? "bg-canvas" : "bg-canvas/30 hover:bg-canvas/50"
                  )}
                  aria-label={`تصویر ${f + 1}`}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
