import { Link } from "react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import { EASE_LUXURY, SPRING_HEFTY } from "@/lib/motion";
import { useMouseParallax } from "@/hooks/use-mouse-parallax";
import { useReducedMotionStrict } from "@/hooks/use-prefers-reduced-motion";
import { TextReveal } from "@/components/motion/TextReveal";
import { ImageMaskReveal } from "@/components/motion/ImageMaskReveal";

const MotionParagraph = motion.p;
const MotionDiv = motion.div;
const MotionDl = motion.dl;

const STATS = [
  { label: "تکه‌های فعال", value: "184" },
  { label: "کارگاه", value: "11" },
  { label: "سال‌های اصلاح", value: "XIV" },
];

/**
 * Hero Choreography — premium alternative to the static Hero.
 * - Word-by-word text reveal on headline
 * - Mouse parallax on decorative plates
 * - Scroll-linked scale on the central stack composition
 * - Subtle backdrop color drift
 * - Animated status pill with pulse
 */
export function HeroChoreography() {
  const reduced = useReducedMotionStrict();
  const sectionRef = useRef<HTMLElement | null>(null);

  const mouse = useMouseParallax({ damping: 0.18 });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const compositionScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const compositionOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.7]);
  const backdropY = useTransform(scrollYProgress, [0, 1], [0, -120]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      <MotionDiv
        aria-hidden
        style={{ y: backdropY, x: reduced ? 0 : mouse.x * -20 }}
        className="pointer-events-none absolute -left-32 top-12 h-[640px] w-[640px] rounded-full bg-accent/40 blur-[140px]"
      />
      <MotionDiv
        aria-hidden
        style={{ x: reduced ? 0 : mouse.x * 24, y: backdropY }}
        className="pointer-events-none absolute -right-40 top-60 h-[520px] w-[520px] rounded-full bg-rose-quartz/30 blur-[140px] opacity-50"
      />

      <MotionDiv
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.18 }}
        transition={{ duration: 1.6, ease: EASE_LUXURY, delay: 0.4 }}
        style={{ y: backdropY }}
        className="pointer-events-none absolute inset-x-0 top-0 h-[680px]"
      >
        <div
          aria-hidden
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.42 0.045 232 / 0.18) 1px, transparent 1px), linear-gradient(90deg, oklch(0.42 0.045 232 / 0.18) 1px, transparent 1px)",
            backgroundSize: "120px 120px",
            maskImage:
              "radial-gradient(ellipse 60% 60% at 50% 30%, black, transparent 70%)",
          }}
        />
      </MotionDiv>

      <div className="relative mx-auto grid max-w-[1728px] gap-16 px-6 pt-20 pb-32 lg:grid-cols-[1.15fr_1fr] lg:px-10 lg:pt-28 lg:pb-40">
        {/* LEFT */}
        <div className="flex flex-col">
          <MotionDiv
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: EASE_LUXURY }}
            className="flex items-center gap-3"
          >
            <span className="h-px w-10 bg-ink/40" />
            <p className="type-eyebrow text-ink-muted">
              Volume XII · Autumn — Winter
            </p>
          </MotionDiv>

          <h1 className="mt-8 font-display text-[clamp(3rem,9vw,8.5rem)] font-light leading-[0.92] tracking-[-0.02em] text-ink">
            {reduced ? (
              "Considered objects, quietly distinguished."
            ) : (
              <>
                <TextReveal
                  asRoot="span"
                  as="words"
                  stagger={0.05}
                  delay={0.15}
                  className="block"
                >
                  Considered objects,
                </TextReveal>
                <TextReveal
                  asRoot="span"
                  as="words"
                  stagger={0.06}
                  delay={0.55}
                  className="block italic text-primary"
                >
                  quietly distinguished.
                </TextReveal>
              </>
            )}
          </h1>

          <MotionParagraph
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_LUXURY, delay: 1.1 }}
            className="mt-10 max-w-xl text-base leading-relaxed text-ink-soft lg:text-lg"
          >
            ÆON is an editorial house of garments and objects. Made in small
            numbers by our ateliers in Florence, Naples and Kyoto — designed to
            be kept.
          </MotionParagraph>

          <MotionDiv
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE_LUXURY, delay: 1.3 }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/shop"
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-ink px-6 py-3.5 text-[12px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary"
            >
              <span className="relative z-10">خرید</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition group-hover:translate-x-1" />
              <MotionDiv
                aria-hidden
                initial={{ x: "-120%" }}
                whileHover={{ x: "120%" }}
                transition={{ duration: 0.7 }}
                className="absolute inset-y-0 -left-1 z-0 w-1/3 bg-canvas/10 blur-md"
              />
            </Link>
            <Link
              to="/collections/autumn-winter"
              className="group inline-flex items-center gap-3 rounded-full glass-subtle px-5 py-3.5 text-[12px] font-medium uppercase tracking-[0.18em] text-ink transition hover:bg-white/60"
            >
              Read the Editorial
              <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </MotionDiv>

          <MotionDl
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.15, delayChildren: 1.5 },
              },
            }}
            className="mt-20 grid max-w-2xl grid-cols-3 gap-8 border-t border-edge pt-8"
          >
            {STATS.map((stat) => (
              <MotionDiv
                key={stat.label}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6 },
                  },
                }}
              >
                <dt className="type-eyebrow text-ink-muted">{stat.label}</dt>
                <dd className="mt-1 font-display text-3xl text-ink lg:text-4xl">
                  {stat.value}
                </dd>
              </MotionDiv>
            ))}
          </MotionDl>
        </div>

        {/* RIGHT — composition */}
        <MotionDiv
          style={{
            scale: reduced ? 1 : compositionScale,
            opacity: compositionOpacity,
          }}
          transition={SPRING_HEFTY}
          className="relative hidden lg:block"
        >
          <ImageMaskReveal
            direction="up"
            threshold={0.2}
            className="absolute right-0 top-0 h-[440px] w-[300px]"
            innerClassName="h-full w-full"
          >
            <div className="gradient-oat relative h-full w-full overflow-hidden rounded-3xl ring-1 ring-inset ring-white/40">
              <div className="absolute inset-x-0 bottom-0 p-6 font-display text-2xl text-ink/80">
                01
              </div>
              <span className="absolute right-4 top-4 font-display text-[10px] tracking-[0.4em] text-ink/55">
                ÆON
              </span>
            </div>
          </ImageMaskReveal>

          <MotionDiv
            style={{
              x: reduced ? 0 : mouse.x * -22,
              y: reduced ? 0 : mouse.y * -18,
            }}
            transition={SPRING_HEFTY}
            className="absolute right-44 top-40"
          >
            <ImageMaskReveal
              direction="left"
              delay={0.2}
              threshold={0.2}
              className="h-[380px] w-[260px]"
            >
              <MotionDiv
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 9,
                  repeat: Infinity,
                  ease: EASE_LUXURY,
                }}
                className="gradient-mist relative h-full w-full overflow-hidden rounded-3xl ring-1 ring-inset ring-white/45 shadow-float"
              >
                <div className="absolute inset-x-0 bottom-0 p-6 font-display text-2xl text-ink/80">
                  02
                </div>
                <span className="absolute right-4 top-4 font-display text-[10px] tracking-[0.4em] text-ink/55">
                  ÆON
                </span>
              </MotionDiv>
            </ImageMaskReveal>
          </MotionDiv>

          <ImageMaskReveal
            direction="up"
            delay={0.4}
            threshold={0.2}
            className="absolute right-6 top-96 h-[260px] w-[260px]"
          >
            <div className="gradient-deep relative h-full w-full overflow-hidden rounded-3xl ring-1 ring-inset ring-white/40">
              <div className="absolute inset-x-0 bottom-0 p-6 font-display text-2xl text-canvas/80">
                03
              </div>
              <span className="absolute right-4 top-4 font-display text-[10px] tracking-[0.4em] text-canvas/60">
                ÆON
              </span>
            </div>
          </ImageMaskReveal>

          {/* Floating status pill */}
          <MotionDiv
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_LUXURY, delay: 1.2 }}
            className="glass-strong relative right-4 top-4 z-10 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-ink"
          >
            <MotionDiv
              aria-hidden
              animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: EASE_LUXURY }}
              className="h-1.5 w-1.5 rounded-full bg-primary"
            />
            New Arrivals · 14 pieces
          </MotionDiv>
        </MotionDiv>
      </div>
    </section>
  );
}
