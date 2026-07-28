/**
 * Motion design tokens and presets — Phase 3 extended.
 * Centralized so every animation across the platform shares the same language.
 */
import type { Easing, Transition, Variants } from "framer-motion";

export const EASE_LUXURY: Easing = [0.16, 1, 0.3, 1];
export const EASE_PRECISE: Easing = [0.65, 0, 0.35, 1];
export const EASE_SOFT: Easing = [0.4, 0, 0.2, 1];
export const EASE_OUT_SOFT: Easing = [0.22, 1, 0.36, 1];

export const DURATION = {
  instant: 0.15,
  fast: 0.28,
  base: 0.42,
  slow: 0.7,
  deliberate: 1.1,
  epic: 1.6,
} as const;

/* === Springs (Phase 3) ============================================ */

export const SPRING_GENTLE = { type: "spring", stiffness: 140, damping: 20, mass: 0.9 } as const;
export const SPRING_SNAP = { type: "spring", stiffness: 380, damping: 30, mass: 0.7 } as const;
export const SPRING_HEFTY = { type: "spring", stiffness: 220, damping: 17, mass: 1.1 } as const;

/* === Base transitions ============================================= */

export const baseTransition: Transition = {
  duration: DURATION.base,
  ease: EASE_LUXURY,
};

export const luxuryTransition: Transition = {
  duration: DURATION.deliberate,
  ease: EASE_LUXURY,
};

export const microTransition: Transition = {
  duration: DURATION.fast,
  ease: EASE_PRECISE,
};

/* === Existing variants ============================================ */

export const revealUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASE_LUXURY },
  },
};

export const revealSoft: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE_LUXURY },
  },
};

export const staggerContainer = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  visible: {
    transition: {
      delayChildren: delay,
      staggerChildren: stagger,
    },
  },
});

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.base, ease: EASE_LUXURY },
  },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.base, ease: EASE_LUXURY },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: DURATION.fast, ease: EASE_PRECISE },
  },
};

export const productCardHover = {
  rest: { y: 0, scale: 1 },
  hover: { y: -6, scale: 1.005, transition: { duration: DURATION.base, ease: EASE_LUXURY } },
};

export const imageZoomIn = {
  rest: { scale: 1.02 },
  hover: { scale: 1.08, transition: { duration: 1.1, ease: EASE_LUXURY } },
};

/* === Phase 3 — text / mask / cursor / fly / route ================== */

/** Word-by-word sweep reveal — used for hero + manifesto headlines. */
export const textRevealWord: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      ease: EASE_OUT_SOFT,
      delay: i * 0.04,
    },
  }),
};

export const textRevealContainer = (stagger = 0.04, delay = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { delayChildren: delay, staggerChildren: stagger },
  },
});

/** Clip-path mask reveal — for hero + featured imagery. */
export const maskReveal: Variants = {
  hidden: { clipPath: "inset(0 0 100% 0)", opacity: 0.6 },
  visible: {
    clipPath: "inset(0 0 0% 0)",
    opacity: 1,
    transition: { duration: DURATION.epic, ease: EASE_LUXURY },
  },
};

export const maskRevealSideways: Variants = {
  hidden: { clipPath: "inset(0 100% 0 0)", opacity: 0.6 },
  visible: {
    clipPath: "inset(0 0% 0 0)",
    opacity: 1,
    transition: { duration: DURATION.epic, ease: EASE_LUXURY },
  },
};

/** Hover lift pattern, applied to product cards. */
export const hoverLift = {
  rest: { y: 0 },
  hover: { y: -6, transition: SPRING_GENTLE },
};

/** Hard press tap-scale */
export const pressTap = {
  rest: { scale: 1 },
  pressed: { scale: 0.97, transition: SPRING_SNAP },
};

/** Magnetic pull wrapper spring — used inside <MagneticHover>. */
export const magneticSpring = SPRING_HEFTY;

/** Cursor core variants — used in <Cursor>. */
export const cursorCore = {
  default: { width: 8, height: 8, opacity: 1, transition: SPRING_SNAP },
  link: { width: 36, height: 36, opacity: 1, transition: SPRING_GENTLE },
  image: { width: 64, height: 64, opacity: 1, transition: SPRING_GENTLE },
  drag: { width: 56, height: 56, opacity: 1, transition: SPRING_GENTLE },
  hidden: { width: 0, height: 0, opacity: 0, transition: SPRING_SNAP },
};

/* === Floats + ornaments === */

export const floatSoft = {
  rest: { y: 0 },
  drift: {
    y: [-8, 8, -8],
    transition: { duration: 9, repeat: Infinity, ease: EASE_LUXURY },
  },
};

export const floatDeep = {
  rest: { y: 0 },
  drift: {
    y: [-14, 14, -14],
    transition: { duration: 13, repeat: Infinity, ease: EASE_LUXURY },
  },
};
