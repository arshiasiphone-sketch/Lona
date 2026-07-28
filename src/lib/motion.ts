/**
 * Motion design tokens and presets.
 * Centralized so every animation across the platform shares the same language.
 */
import type { Easing, Transition, Variants } from "framer-motion";

export const EASE_LUXURY: Easing = [0.16, 1, 0.3, 1];
export const EASE_PRECISE: Easing = [0.65, 0, 0.35, 1];
export const EASE_SOFT: Easing = [0.4, 0, 0.2, 1];

export const DURATION = {
  instant: 0.15,
  fast: 0.28,
  base: 0.42,
  slow: 0.7,
  deliberate: 1.1,
  epic: 1.6,
} as const;

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

/**
 * Reveal — gentle scroll-triggered entrance.
 */
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
