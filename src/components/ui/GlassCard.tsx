import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/glass";

type GlassTier = "subtle" | "default" | "strong";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  tier?: GlassTier;
  edge?: boolean;
  padded?: boolean;
  children: ReactNode;
}

const tierClass: Record<GlassTier, string> = {
  subtle: "glass-subtle",
  default: "glass",
  strong: "glass-strong",
};

export function GlassCard({
  tier = "default",
  edge = true,
  padded = false,
  className,
  children,
  ...rest
}: GlassCardProps) {
  return (
    <div
      {...rest}
      className={cn(
        tierClass[tier],
        "rounded-2xl",
        edge && "edge-highlight",
        padded && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
