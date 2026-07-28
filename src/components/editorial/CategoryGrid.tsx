/**
 * Lona — Category grid.
 *
 * 8 lingerie categories rendered as a calm 2-col mobile / 4-col desktop
 * grid. Subtle gradient plates, serif labels, hairline-bordered quick
 * links. No busy icons — the word itself is the icon.
 */
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { EASE_LUXURY } from "@/lib/motion";
import { cn } from "@/lib/glass";

interface Category {
  name: string;
  path: string;
  gradient: "gradient-oat" | "gradient-mist" | "gradient-rose-quartz" | "gradient-deep" | "gradient-lona-rose" | "gradient-lona-pearl";
  tone: "ink" | "canvas";
}

const CATEGORIES: Category[] = [
  { name: "سوتین", path: "/shop?category=intimates-bras", gradient: "gradient-oat", tone: "ink" },
  { name: "شورت", path: "/shop?category=intimates-briefs", gradient: "gradient-lona-pearl", tone: "ink" },
  { name: "ست لباس زیر", path: "/shop?category=intimates-sets", gradient: "gradient-rose-quartz", tone: "ink" },
  { name: "لباس خواب", path: "/shop?category=sleepwear", gradient: "gradient-mist", tone: "ink" },
  { name: "لباس راحتی", path: "/shop?category=homewear", gradient: "gradient-lona-rose", tone: "ink" },
  { name: "بادی", path: "/shop?category=bodysuit", gradient: "gradient-oat", tone: "ink" },
  { name: "گن", path: "/shop?category=shapewear", gradient: "gradient-mist", tone: "ink" },
  { name: "اکسسوری", path: "/shop?category=intimates-accessories", gradient: "gradient-deep", tone: "canvas" },
];

export function CategoryGrid() {
  return (
    <section
      className="mx-auto mt-32 max-w-[1728px] px-6 lg:px-10"
      aria-label="دسته‌بندی‌های لونا"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">بوتیک</p>
          <h2 className="mt-3 font-display text-4xl font-light leading-[1.08] text-ink lg:text-5xl">
            دسته‌بندی‌ها
          </h2>
        </div>
        <p className="max-w-md font-sans text-sm font-light leading-relaxed text-ink-muted md:text-start">
          هشت خانواده‌ی ظریف، از سوتین‌های روزمره تا لباس‌های خواب.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: EASE_LUXURY, delay: i * 0.05 }}
          >
            <Link
              to={cat.path}
              className="focus-luxury group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-canvas"
              aria-label={cat.name}
            >
              <div
                className={cn(
                  "absolute inset-0 transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]",
                  cat.gradient
                )}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/35 transition-all duration-700 group-hover:ring-[1.5px] group-hover:ring-[oklch(0.78_0.08_75/0.16)]"
              />
              {/* gradient mask at the bottom so the label reads cleanly */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent opacity-50"
              />
              <span
                className={cn(
                  "absolute bottom-5 inset-x-0 text-center font-display text-2xl font-light leading-tight lg:text-3xl",
                  cat.tone === "canvas" ? "text-canvas" : "text-ink"
                )}
              >
                {cat.name}
              </span>
              <span
                className={cn(
                  "absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-canvas/40 backdrop-blur-sm transition group-hover:bg-canvas/70",
                  cat.tone === "canvas" ? "text-canvas" : "text-ink"
                )}
              >
                <ArrowLeft className="h-3 w-3" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}