import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

/**
 * Centralized reduced-motion hook.
 * Everything motion-related reads from this so the gating is in one place.
 */
export function useReducedMotionStrict(): boolean {
  return useFramerReducedMotion() ?? false;
}

export function useReducedMotionFromMedia(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
