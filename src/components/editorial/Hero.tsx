import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { EASE_LUXURY } from "@/lib/motion";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Composition — atmospheric layers */}
      <div className="pointer-events-none absolute -left-32 top-12 h-[640px] w-[640px] rounded-full bg-accent/40 blur-[140px]" />
      <div className="pointer-events-none absolute -right-40 top-60 h-[520px] w-[520px] rounded-full bg-rose-quartz/30 blur-[140px] opacity-50" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[680px] opacity-[0.18]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.42 0.045 232 / 0.18) 1px, transparent 1px), linear-gradient(90deg, oklch(0.42 0.045 232 / 0.18) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          maskImage:
            "radial-gradient(ellipse 60% 60% at 50% 30%, black, transparent 70%)",
        }}
      />

      <div className="relative mx-auto grid max-w-[1728px] gap-16 px-6 pt-20 pb-32 lg:grid-cols-[1.15fr_1fr] lg:px-10 lg:pt-28 lg:pb-40">
        {/* Left — wordmark + headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: EASE_LUXURY }}
          className="flex flex-col"
        >
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-ink/40" />
            <p className="type-eyebrow text-ink-muted">Volume XII · Autumn — Winter</p>
          </div>
          <h1 className="mt-8 font-display text-[clamp(3rem,9vw,8.5rem)] font-light leading-[0.92] tracking-[-0.02em] text-ink">
            Considered objects,
            <br />
            <span className="italic font-normal text-primary">quietly distinguished.</span>
          </h1>
          <p className="mt-10 max-w-xl text-base leading-relaxed text-ink-soft lg:text-lg">
            ÆON is an editorial house of garments and objects. Made in small numbers
            by our ateliers in Florence, Naples and Kyoto — designed to be kept.
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Link
              to="/shop"
              className="group inline-flex items-center gap-3 rounded-full bg-ink px-6 py-3.5 text-[12px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary"
            >
              Shop the Season
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <Link
              to="/collections/autumn-winter"
              className="group inline-flex items-center gap-3 rounded-full glass-subtle px-5 py-3.5 text-[12px] font-medium uppercase tracking-[0.18em] text-ink transition hover:bg-white/60"
            >
              Read the Editorial
              <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
          <dl className="mt-20 grid max-w-2xl grid-cols-3 gap-8 border-t border-edge pt-8">
            {[
              { label: "Pieces in rotation", value: "184" },
              { label: "Ateliers", value: "11" },
              { label: "Years refining", value: "XIV" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="type-eyebrow text-ink-muted">{stat.label}</dt>
                <dd className="mt-1 font-display text-3xl text-ink lg:text-4xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </motion.div>

        {/* Right — hero composition (glassy card stack) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: EASE_LUXURY, delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <div className="absolute inset-0">
            <div className="absolute right-0 top-0 h-[440px] w-[300px] gradient-oat rounded-3xl ring-1 ring-inset ring-white/40">
              <div className="absolute inset-x-0 bottom-0 p-6 font-display text-2xl text-ink/80">
                01
              </div>
              <span className="absolute right-4 top-4 font-display text-[10px] tracking-[0.4em] text-ink/55">
                ÆON
              </span>
            </div>
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: EASE_LUXURY }}
              className="absolute right-44 top-40 h-[380px] w-[260px] gradient-mist rounded-3xl ring-1 ring-inset ring-white/45 shadow-float"
            >
              <div className="absolute inset-x-0 bottom-0 p-6 font-display text-2xl text-ink/80">
                02
              </div>
              <span className="absolute right-4 top-4 font-display text-[10px] tracking-[0.4em] text-ink/55">
                ÆON
              </span>
            </motion.div>
            <div className="absolute right-6 top-96 h-[260px] w-[260px] gradient-deep rounded-3xl ring-1 ring-inset ring-white/40">
              <div className="absolute inset-x-0 bottom-0 p-6 font-display text-2xl text-canvas/80">
                03
              </div>
              <span className="absolute right-4 top-4 font-display text-[10px] tracking-[0.4em] text-canvas/60">
                ÆON
              </span>
            </div>
          </div>
          {/* Floating chip */}
          <div className="glass-strong relative right-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-ink">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            New Arrivals · 14 pieces
          </div>
        </motion.div>
      </div>
    </section>
  );
}
