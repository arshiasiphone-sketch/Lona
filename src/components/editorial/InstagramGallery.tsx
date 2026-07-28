import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";

const gradients: Array<"gradient-mist" | "gradient-oat" | "gradient-rose-quartz" | "gradient-deep"> = [
  "gradient-oat",
  "gradient-mist",
  "gradient-rose-quartz",
  "gradient-oat",
  "gradient-deep",
  "gradient-mist",
];

const captions = [
  "In the Florence atelier",
  "A walk in Gion",
  "Studio №4, SoHo",
  "Saturday at the studio",
  "Curing the leather",
  "Winter in Kyoto",
];

export function InstagramGallery() {
  return (
    <section className="mx-auto mt-32 max-w-[1728px] px-6 lg:px-10">
      <div className="flex items-end justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">Follow Along</p>
          <h2 className="mt-3 font-display text-4xl leading-[1.02] text-ink lg:text-5xl">
            @aeon.atelier
          </h2>
        </div>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full hairline bg-canvas/60 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink hover:bg-white"
        >
          <Instagram className="h-3.5 w-3.5" />
          Follow
        </a>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {gradients.map((g, i) => (
          <motion.a
            key={i}
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.4, ease: EASE_LUXURY }}
            className="group relative aspect-square overflow-hidden rounded-2xl ring-1 ring-inset ring-white/35"
            aria-label={`Instagram post · ${captions[i]}`}
          >
            <div className={cn("absolute inset-0", g)} />
            <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-2 py-1 font-display text-[9px] tracking-[0.4em] text-canvas opacity-0 transition group-hover:opacity-100">
              ÆON
            </span>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
              <span className="line-clamp-1 text-[11px] font-medium text-ink/85">
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
