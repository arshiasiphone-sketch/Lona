import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";

const gradients: Array<
  "gradient-mist" | "gradient-oat" | "gradient-rose-quartz" | "gradient-deep" | "gradient-lona-rose" | "gradient-lona-pearl"
> = [
  "gradient-lona-pearl",
  "gradient-oat",
  "gradient-rose-quartz",
  "gradient-mist",
  "gradient-lona-rose",
  "gradient-deep",
];

const captions = [
  "صبح، در بوتیک",
  "نخ ابریشم",
  "یک بعدازظهر آرام",
  "دوخت دست",
  "پارچه‌ی گلدار",
  "نور ملایم",
];

export function InstagramGallery() {
  return (
    <section
      className="mx-auto mt-36 max-w-[1728px] px-6 lg:px-10"
      aria-label="اینستاگرام لونا"
    >
      <div className="flex items-end justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">ما را دنبال کنید</p>
          <h2 className="mt-3 font-display text-4xl font-light leading-[1.02] text-ink lg:text-5xl">
            @lona.lingerie
          </h2>
        </div>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full hairline bg-canvas/60 px-4 py-2 font-sans text-[11px] font-medium tracking-[0.04em] text-ink hover:bg-white"
        >
          <Instagram className="h-3.5 w-3.5" />
          دنبال کنید
        </a>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {gradients.map((g, i) => (
          <motion.a
            key={i}
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            whileHover={{ y: -3 }}
            transition={{ duration: 0.45, ease: EASE_LUXURY }}
            className="group relative aspect-square overflow-hidden rounded-2xl ring-1 ring-inset ring-white/35"
            aria-label={`پست اینستاگرام · ${captions[i]}`}
          >
            <div className={cn("absolute inset-0", g)} />
            <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-2 py-1 font-latin-display text-[9px] tracking-[0.36em] text-canvas opacity-0 transition group-hover:opacity-100">
              LONA
            </span>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
              <span className="line-clamp-1 font-sans text-[11px] font-medium text-ink/85">
                {captions[i]}
              </span>
              <Instagram className="h-3.5 w-3.5 text-ink/80" />
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}