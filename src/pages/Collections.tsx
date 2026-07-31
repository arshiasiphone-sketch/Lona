import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { collections } from "@/data/catalog";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { usePageMeta } from "@/lib/seo";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { LONA_MOCK_IMAGES } from "@/data/mock-images";

const COLLECTION_IMAGES = [
  LONA_MOCK_IMAGES.editorialFashion,
  LONA_MOCK_IMAGES.silkDetail,
  LONA_MOCK_IMAGES.wardrobe,
  LONA_MOCK_IMAGES.neutralFashion,
] as const;

export default function Collections() {
  usePageMeta({
    title: "کالکسیون‌ها",
    description: "کالکسیون‌های لونا — مجموعه‌های فصلی و ماندگار لباس زیر، لباس خواب و پوشاک راحتی زنانه با طراحی ظریف و کیفیت بالا.",
    canonical: `${window.location.origin}/collections`,
    ogType: "website",
  });
  return (
    <div className="mx-auto max-w-[1728px] px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <header>
        <p className="type-eyebrow text-ink-muted">خانهٔ لونا</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-8xl">
          کالکسیون‌ها
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-soft lg:text-base">
          چهار فصل. لونا هر سال دو دورهٔ تازه منتشر می‌کند. کالکسیون ماندگار در
          کنار آن‌ها اصلاح می‌شود، هرگز جایگزین نمی‌گردد.
        </p>
      </header>

      <div className="mt-16 grid gap-6 md:grid-cols-2">
        {collections.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.9, ease: EASE_LUXURY, delay: i * 0.08 }}
          >
            <Link
              to={`/collections/${c.slug}`}
              className="group focus-luxury block overflow-hidden rounded-3xl"
            >
              <EditorialImage
                  src={COLLECTION_IMAGES[i % COLLECTION_IMAGES.length]}
                  alt={`${c.name} — تصویر کالکشن لونا`}
                  className={cn(
                    "relative aspect-[4/3] w-full transition duration-700 group-hover:scale-[1.03]",
                    c.gradient === "oat" && "gradient-oat",
                    c.gradient === "mist" && "gradient-mist",
                    c.gradient === "deep" && "gradient-deep",
                    c.gradient === "rose" && "gradient-rose-quartz"
                  )}
                  imgClassName="opacity-90"
                >
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/40" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-8 text-canvas">
                  <p
                    className={cn(
                      "type-eyebrow",
                      c.gradient === "deep" ? "text-canvas/80" : "text-ink/60"
                    )}
                  >
                    {c.eyebrow}
                  </p>
                  <h2
                    className={cn(
                      "font-display text-5xl leading-[0.95]",
                      c.gradient === "deep" ? "text-canvas" : "text-ink"
                    )}
                  >
                    {c.name}
                  </h2>
                  <span
                    className={cn(
                      "mt-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]",
                      c.gradient === "deep" ? "text-canvas" : "text-ink"
                    )}
                  >
                    ورود به کالکسیون
                    <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:translate-x-0 rtl:group-hover:-translate-x-0.5" />
                  </span>
                </div>
              </EditorialImage>
              <div className="py-6">
                <p className="text-sm leading-relaxed text-ink-soft">
                  {c.description}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
