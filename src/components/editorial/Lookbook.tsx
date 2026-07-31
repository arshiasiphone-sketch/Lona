/**
 * Lona — Lookbook.
 *
 * Three editorial plates rendered with maximum whitespace. Each plate
 * pairs a gradient image with a quiet caption + large translucent
 * numeral. The numerals animate in via Reveal-style masking.
 *
 * Every plate image is an admin-editable homepage slot — overrides are
 * resolved through `useHomepageImages` and fall back to the default
 * luxury imagery when unset.
 */
import { motion } from "framer-motion";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { useHomepageImages } from "@/lib/homepage-images";

interface Plate {
  eyebrow: string;
  title: string;
  body: string;
  gradient:
    | "gradient-mist"
    | "gradient-oat"
    | "gradient-rose-quartz"
    | "gradient-deep"
    | "gradient-lona-rose"
    | "gradient-lona-pearl";
  align: "left" | "right";
  slot: "lookbook_1" | "lookbook_2" | "lookbook_3";
}

const plates: Plate[] = [
  {
    eyebrow: "نگاه ۰۱",
    title: "صبح، در آینه",
    body: "سوتین ابریشمی کرم، شورت هماهنگ، و یک لباس خواب گشاد — اولین ساعت روز، آرام.",
    gradient: "gradient-lona-pearl",
    align: "right",
    slot: "lookbook_1",
  },
  {
    eyebrow: "نگاه ۰۲",
    title: "بعدازظهر، در خانه",
    body: "بادی نخی، شلوارک خانگی، یک فنجان چای کنار پنجره.",
    gradient: "gradient-rose-quartz",
    align: "left",
    slot: "lookbook_2",
  },
  {
    eyebrow: "نگاه ۰۳",
    title: "شب، بی‌صدا",
    body: "لباس خواب حریر مشکی، یک شمع خاموش، و یک کتاب نیمه‌خوانده.",
    gradient: "gradient-deep",
    align: "right",
    slot: "lookbook_3",
  },
];

export function Lookbook() {
  const images = useHomepageImages();

  return (
    <section
      className="mx-auto mt-36 max-w-[1728px] px-6 lg:px-10"
      aria-label="لوک‌بوک"
    >
      <div className="flex items-end justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">لوک‌بوک</p>
          <h2 className="mt-3 font-display text-4xl font-light leading-[1.02] text-ink lg:text-6xl">
            سه نگاه
          </h2>
        </div>
        <p className="hidden max-w-md font-sans text-sm font-light leading-relaxed text-ink-muted md:block md:text-start">
          عکاسی از سه صبح متفاوت، در سه خانه‌ی متفاوت — توسط دفتر ادبی لونا.
        </p>
      </div>

      <div className="mt-20 space-y-24">
        {plates.map((p, i) => (
          <motion.article
            key={p.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease: EASE_LUXURY, delay: i * 0.08 }}
            className={cn(
              "relative grid items-center gap-10 lg:gap-20",
              "lg:grid-cols-[1fr_minmax(0,1.15fr)]",
              p.align === "right" && "lg:[&>*:first-child]:order-2"
            )}
          >
            <EditorialImage
              src={images[p.slot]}
              alt={`${p.title} — لوک‌بوک لونا`}
              className={cn(
                "relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-inset ring-white/35",
              )}
              imgClassName="opacity-90"
              fallbackClassName={p.gradient}
            >
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-8 lg:p-12">
                <p
                  className={cn(
                    "type-eyebrow",
                    p.gradient === "gradient-deep"
                      ? "text-canvas/80"
                      : "text-ink/60"
                  )}
                >
                  {p.eyebrow}
                </p>
                <span
                  className={cn(
                    "font-display text-3xl font-light leading-tight lg:text-5xl",
                    p.gradient === "gradient-deep" ? "text-canvas" : "text-ink"
                  )}
                >
                  {p.title}
                </span>
              </div>
            </EditorialImage>
            <div className="relative">
              <span className="font-display text-7xl font-light leading-none text-ink/15 lg:text-9xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p
                className={cn(
                  "mt-6 max-w-md font-sans text-base font-light leading-[1.95] lg:text-lg",
                  p.gradient === "gradient-deep"
                    ? "text-canvas-soft"
                    : "text-ink-soft"
                )}
              >
                {p.body}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
