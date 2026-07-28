/**
 * Lona — Vogue-style editorial hero.
 *
 * Asymmetric 70 / 30 layout: a single pearl/rose editorial plate on one
 * side, a narrow text column with generous whitespace on the other. No
 * triple-stack, no parallax, no status pill, no stat dl. The intent is
 * to read like a magazine cover, not a shop.
 *
 * Typography stays in the editorial register — Cormorant Garamond Light
 * for the headline, Vazirmatn for the body. CTAs are hairline pills and
 * underlined text links, not heavy filled blocks.
 */
import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { EASE_LUXURY } from "@/lib/motion";
import { useReducedMotionStrict } from "@/hooks/use-prefers-reduced-motion";

export function Hero() {
  const reduced = useReducedMotionStrict();
  return (
    <section
      className="relative mx-auto flex min-h-[88vh] max-w-[1728px] flex-col gap-10 px-6 pt-24 pb-20 lg:flex-row-reverse lg:items-center lg:gap-16 lg:px-10 lg:pt-32 lg:pb-28"
      aria-label="هero لونا"
    >
      {/* Editorial plate — 70% width on desktop (flex-row-reverse so it sits on the right in RTL) */}
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: EASE_LUXURY }}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] ring-1 ring-inset ring-white/35 shadow-glass lg:aspect-auto lg:h-[82vh] lg:w-[68%]"
      >
        <div className="gradient-lona-rose absolute inset-0" />
        {/* Sheen — soft top-light wash */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 65% 50% at 30% 20%, oklch(0.99 0.015 80 / 0.55), transparent 60%)",
          }}
        />
        {/* Bottom depth */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/3 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(180deg, transparent 0%, oklch(0.32 0.06 18 / 0.18) 100%)",
          }}
        />
        {/* Editorial label, top-right */}
        <div className="absolute right-6 top-6 flex items-center gap-2 lg:right-10 lg:top-10">
          <span className="h-px w-8 bg-canvas/55" />
          <p className="type-eyebrow text-canvas/80">
            شماره دوازدهم — لباس زیر زنانه
          </p>
        </div>
        {/* Editorial label, bottom-left */}
        <div className="absolute bottom-6 left-6 lg:bottom-10 lg:left-10">
          <p className="font-latin-display text-[10px] tracking-[0.36em] text-canvas/65">
            LONA · INTIMATES
          </p>
          <p className="mt-2 font-display text-[clamp(2rem,4vw,3.6rem)] font-light leading-[0.96] text-canvas">
            <span className="italic font-light">زنانه</span>،{" "}
            <span className="italic font-light">روزمره</span>.
          </p>
        </div>
      </motion.div>

      {/* Text column — 30% width on desktop */}
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: EASE_LUXURY, delay: 0.25 }}
        className="flex w-full flex-col lg:w-[32%]"
      >
        <p className="type-eyebrow text-ink-muted">بوتیک لونا</p>

        <h1 className="mt-7 font-display text-[clamp(2.4rem,4.4vw,4.4rem)] font-light leading-[1.18] tracking-[-0.005em] text-ink">
          زیبایی، راحتی و اعتمادبه‌نفس؛
          <br />
          <span className="italic font-light text-primary">در کنار هم.</span>
        </h1>

        <p className="mt-8 max-w-md font-sans text-[15px] font-light leading-[1.85] text-ink-soft">
          لونا مجموعه‌ای از لباس زیر، لباس خواب و پوشاک راحتی زنانه را با تمرکز
          بر کیفیت پارچه، طراحی ظریف و راحتی روزمره ارائه می‌دهد تا تجربه‌ای
          دلپذیر از خرید آنلاین برای شما فراهم شود.
        </p>

        <div className="mt-12 flex flex-col items-start gap-5">
          <Link
            to="/collections"
            className="group inline-flex items-center gap-3 rounded-full border border-ink/20 bg-canvas/30 px-7 py-3 font-sans text-[13px] font-medium tracking-[0.04em] text-ink transition hover:border-ink hover:bg-ink hover:text-canvas"
          >
            مشاهده کالکسیون
            <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-1" />
          </Link>
          <Link
            to="/shop"
            className="group inline-flex items-center gap-2 font-sans text-[13px] font-medium text-ink-soft transition hover:text-ink"
          >
            <span className="border-b border-ink/35 pb-0.5 transition group-hover:border-ink">
              محصولات جدید
            </span>
          </Link>
        </div>

        {/* Quiet editorial meta — no stat dl */}
        <div className="mt-20 flex items-center gap-6">
          <span className="h-px w-8 bg-ink/35" />
          <p className="type-eyebrow text-ink-muted">
            تأسیس ۱۳۹۸ · تهران و فلورانس
          </p>
        </div>
      </motion.div>
    </section>
  );
}