/**
 * Glass surface variants and class helpers.
 * Compose with the .glass / .glass-strong / .glass-subtle utilities in CSS.
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
 * Each title maps to a refined hue family for the mock catalog.
 */
export const PRODUCT_GRADIENTS = {
  mist: "gradient-mist",
  oat: "gradient-oat",
  rose: "gradient-rose-quartz",
  deep: "gradient-deep",
} as const;

export type GradientKey = keyof typeof PRODUCT_GRADIENTS;
