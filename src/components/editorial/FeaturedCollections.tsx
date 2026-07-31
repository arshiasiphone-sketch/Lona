import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { Collection } from "@/data/catalog";
import { EASE_LUXURY } from "@/lib/motion";
import { cn } from "@/lib/glass";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { useHomepageImages } from "@/lib/homepage-images";

const COLLECTION_SLOTS = [
  "featured_collection_1",
  "featured_collection_2",
  "featured_collection_3",
] as const;

interface Props {
  collections: Collection[];
  title?: string;
  eyebrow?: string;
}

export function FeaturedCollections({
  collections,
  title = "Volume XII",
  eyebrow = "Collections",
}: Props) {
  const images = useHomepageImages();

  return (
    <section className="mx-auto mt-24 max-w-[1728px] px-6 lg:px-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">{eyebrow}</p>
          <h2 className="mt-3 font-display text-4xl leading-[1.05] text-ink lg:text-6xl">
            {title}
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-ink-muted md:text-right">
          Four chapters. Every chapter is a question of cloth, line and long wear.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        {collections.slice(0, 3).map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: EASE_LUXURY, delay: i * 0.08 }}
          >
            <Link
              to={`/collections/${c.slug}`}
              className="group focus-luxury block overflow-hidden rounded-2xl"
            >
              <div className="relative aspect-[4/5] w-full">
                <EditorialImage
                  src={images[COLLECTION_SLOTS[i % COLLECTION_SLOTS.length]]}
                  alt={`${c.name} — کالکشن لونا`}
                  className="absolute inset-0 h-full w-full transition duration-700 group-hover:scale-105"
                  imgClassName="opacity-90"
                  fallbackClassName={cn(
                    c.gradient === "oat" && "gradient-oat",
                    c.gradient === "mist" && "gradient-mist",
                    c.gradient === "deep" && "gradient-deep",
                    c.gradient === "rose" && "gradient-rose-quartz"
                  )}
                />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/40" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-7 text-canvas">
                  <p className="type-eyebrow opacity-80">{c.eyebrow}</p>
                  <h3
                    className={cn(
                      "font-display text-4xl leading-[0.95]",
                      c.gradient === "deep" ? "text-canvas" : "text-ink"
                    )}
                  >
                    {c.name}
                  </h3>
                  <p
                    className={cn(
                      "max-w-md text-sm",
                      c.gradient === "deep" ? "text-canvas/85" : "text-ink/70"
                    )}
                  >
                    {c.description}
                  </p>
                  <span
                    className={cn(
                      "mt-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]",
                      c.gradient === "deep" ? "text-canvas" : "text-ink"
                    )}
                  >
                    Enter
                    <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
