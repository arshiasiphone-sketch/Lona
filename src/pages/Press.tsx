import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { editorials } from "@/data/catalog";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { Reveal } from "@/components/motion/Reveal";
import { formatDate } from "@/lib/format";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { useHomepageImages } from "@/lib/homepage-images";

const PRESS_SLOTS = ["press_1", "press_2", "press_3", "press_4"] as const;

const gradientMap: Record<string, string> = {
  mist: "gradient-mist",
  oat: "gradient-oat",
  rose: "gradient-rose-quartz",
  deep: "gradient-deep",
};

const gradientFor = (key: string): string => gradientMap[key] ?? "gradient-oat";

const categoryLabel: Record<string, string> = {
  journal: "مجله",
  atelier: "یادداشت کارگاه",
  campaign: "کالکسیون",
};

export default function Press() {
  const [hero, ...rest] = editorials;
  const images = useHomepageImages();

  return (
    <div className="mx-auto max-w-[1728px] px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <header>
        <p className="type-eyebrow text-ink-muted">مجلهٔ لونا</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-8xl">
          روایت‌های بلند خانهٔ لونا.
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-soft lg:text-base">
          نوشته‌ها، یادداشت‌های کارگاه و آرشیو کالکسیون‌ها — هر زمان که سخنی
          برای گفتن باشد، نه زودتر.
        </p>
      </header>

      {/* Hero editorial */}
      <Reveal>
        <Link
          to={`/press/${hero.slug}`}
          className="group mt-16 block overflow-hidden rounded-3xl focus-luxury"
        >
          <EditorialImage
            src={images.press_hero}
            alt={`${hero.title} — مجله لونا`}
            className={cn("relative aspect-[16/8]", gradientFor(hero.cover))}
            imgClassName="opacity-90"
          >
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/40" />
            <div className="absolute inset-x-0 bottom-0 p-8 lg:p-14">
              <p className="type-eyebrow text-ink/70">
                {categoryLabel[hero.category]} · {formatDate(hero.publishedAt)}
              </p>
              <h2 className="mt-4 max-w-3xl font-display text-4xl leading-[1.02] text-ink lg:text-7xl">
                {hero.title}
              </h2>
              <p className="mt-4 max-w-xl text-sm text-ink/75 lg:text-base">
                {hero.excerpt}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink">
                ادامه
                <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:translate-x-0 rtl:group-hover:-translate-x-0.5" />
              </span>
            </div>
          </EditorialImage>
        </Link>
      </Reveal>

      {/* Editorial grid */}
      <div className="mt-24 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((e, i) => (
          <motion.article
            key={e.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: EASE_LUXURY, delay: i * 0.06 }}
          >
            <Link to={`/press/${e.slug}`} className="group block overflow-hidden rounded-2xl">
              <EditorialImage
                src={images[PRESS_SLOTS[i % PRESS_SLOTS.length]]}
                alt={`${e.title} — مجله لونا`}
                className={cn(
                  "relative aspect-[4/5] transition duration-700 group-hover:scale-[1.03]",
                  gradientFor(e.cover)
                )}
                imgClassName="opacity-90"
              >
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/40" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-canvas">
                  <p
                    className={cn(
                      "type-eyebrow",
                      e.cover === "deep" ? "text-canvas/80" : "text-ink/60"
                    )}
                  >
                    {categoryLabel[e.category]} · {formatDate(e.publishedAt)}
                  </p>
                  <h3
                    className={cn(
                      "mt-3 font-display text-3xl leading-[1] lg:text-4xl",
                      e.cover === "deep" ? "text-canvas" : "text-ink"
                    )}
                  >
                    {e.title}
                  </h3>
                  <span
                    className={cn(
                      "mt-5 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]",
                      e.cover === "deep" ? "text-canvas" : "text-ink"
                    )}
                  >
                    ادامه
                    <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:translate-x-0 rtl:group-hover:-translate-x-0.5" />
                  </span>
                </div>
              </EditorialImage>
            </Link>
          </motion.article>
        ))}
      </div>

      <div className="mt-24 text-center">
        <p className="font-display text-lg text-ink-muted">داستان‌های بیشتر در راه است.</p>
        <p className="mt-2 text-sm text-ink-muted">
          برای دریافت نامهٔ فصلی، ایمیل خود را در پایان همین صفحه ثبت کنید.
        </p>
      </div>
    </div>
  );
}
