import { motion } from "framer-motion";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";

interface Plate {
  eyebrow: string;
  title: string;
  body: string;
  gradient: "gradient-mist" | "gradient-oat" | "gradient-rose-quartz" | "gradient-deep";
  align: "left" | "right";
}

const plates: Plate[] = [
  {
    eyebrow: "Look 01",
    title: "Office, in a softer light",
    body: "The Paragon coat over a half-canvassed blazer, low button, the wool still holding its weight after a long day.",
    gradient: "gradient-oat",
    align: "left",
  },
  {
    eyebrow: "Look 02",
    title: "Saturday in the studio",
    body: "The Callisto linen, hand-washed and softened by a season, paired with the Constellation shirt left slightly open at the neck.",
    gradient: "gradient-mist",
    align: "right",
  },
  {
    eyebrow: "Look 03",
    title: "An evening, quietly",
    body: "Whitehaven slip dress in crepe, hair pinned with a single strand of pearl light — the room keeps its hush around you.",
    gradient: "gradient-rose-quartz",
    align: "left",
  },
  {
    eyebrow: "Look 04",
    title: "Gion, six in the morning",
    body: "Soren cashmere drawn over the shoulders, the Glycine tote at the hip. The city is still empty enough for footsteps.",
    gradient: "gradient-deep",
    align: "right",
  },
];

export function Lookbook() {
  return (
    <section className="mx-auto mt-32 max-w-[1728px] px-6 lg:px-10">
      <div className="flex items-end justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">Lookbook</p>
          <h2 className="mt-3 font-display text-4xl leading-[1.02] text-ink lg:text-7xl">
            Four considerations
          </h2>
        </div>
        <p className="hidden max-w-md text-sm text-ink-soft md:block md:text-right lg:text-base">
          Worn in Tuscany, Kyoto and SoHo — photographed by our editorial office over the autumn quarter.
        </p>
      </div>

      <div className="mt-14 space-y-12">
        {plates.map((p, i) => (
          <motion.article
            key={p.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease: EASE_LUXURY, delay: i * 0.06 }}
            className={cn(
              "relative grid items-center gap-8 lg:gap-16",
              "lg:grid-cols-[1fr_minmax(0,1.2fr)]",
              p.align === "right" && "lg:[&>*:first-child]:order-2"
            )}
          >
            <div className={cn("relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-inset ring-white/35", p.gradient)}>
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-8 text-canvas lg:p-12">
                <p
                  className={cn(
                    "type-eyebrow",
                    p.gradient === "gradient-deep" ? "text-canvas/80" : "text-ink/60"
                  )}
                >
                  {p.eyebrow}
                </p>
                <span
                  className={cn(
                    "font-display text-3xl leading-tight lg:text-5xl",
                    p.gradient === "gradient-deep" ? "text-canvas" : "text-ink"
                  )}
                >
                  {p.title}
                </span>
              </div>
            </div>
            <div className="relative">
              <span className="font-display text-7xl font-light leading-none tracking-[-0.04em] text-ink/15 lg:text-9xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p
                className={cn(
                  "mt-4 max-w-md text-base leading-relaxed lg:text-lg",
                  p.gradient === "gradient-deep" ? "text-canvas-soft" : "text-ink-soft"
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
