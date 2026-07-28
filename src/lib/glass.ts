/**
 * Glass surface variants and class helpers — Lona theme.
 */
import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const glassClass = (tier: "subtle" | "default" | "strong") => {
  switch (tier) {
    case "subtle":
      return "glass-subtle";
    case "strong":
      return "glass-strong";
    default:
      return "glass";
  }
};

/**
 * CSS gradient class strings for product placeholder imagery.
 * Lona-aligned palette: pearl / oat / rose / blush / noir / ivory.
 */
export const PRODUCT_GRADIENTS = {
  mist: "gradient-mist",
  oat: "gradient-oat",
  rose: "gradient-rose-quartz",
  blush: "gradient-lona-rose",
  pearl: "gradient-lona-pearl",
  deep: "gradient-deep",
  noir: "gradient-lona-noir",
} as const;

export type GradientKey = keyof typeof PRODUCT_GRADIENTS;
