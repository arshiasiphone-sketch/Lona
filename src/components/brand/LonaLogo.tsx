/**
 * LONA — Inline brand component.
 *
 * The mark is a pearl disc with a serif "LONA" wordmark and a
 * four-point sparkle nested inside the letter "O". Rendered as
 * inline SVG so it scales without rasterisation, uses `currentColor`
 * for the wordmark so the parent can drive the ink tone, and stays
 * crisp on retina and ultra-wide.
 *
 * Variants:
 *   default   — full disc + wordmark + sparkle (default sizes 28-44)
 *   wordmark  — wordmark only (no disc), for footers + tight chrome
 *   mark      — disc + sparkle only, for favicons + admin chrome
 *   inverse   — pearl background, ink wordmark (default in 99% of surfaces)
 */
import * as React from "react";
import { cn } from "@/lib/glass";

type Variant = "default" | "wordmark" | "mark" | "inverse";

interface LonaLogoProps {
  variant?: Variant;
  size?: number;
  className?: string;
  /** ARIA override; defaults depend on variant. */
  title?: string;
  /** Disable sparkle animation (e.g. when used inside a reduced-motion context). */
  static?: boolean;
}

const DEFAULT_LABEL: Record<Variant, string> = {
  default: "لونا",
  wordmark: "لونا",
  mark: "نشان لونا",
  inverse: "لونا",
};

export function LonaLogo({
  variant = "default",
  size = 36,
  className,
  title,
  static: isStatic,
}: LonaLogoProps) {
  const w = variant === "wordmark" ? Math.round(size * 1.9) : size;
  const h = size;
  const aria = title ?? DEFAULT_LABEL[variant];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={w}
      height={h}
      role="img"
      aria-label={aria}
      className={cn("select-none", className)}
    >
      <title>{aria}</title>
      <defs>
        <radialGradient id="lona-pearl" cx="50%" cy="38%" r="68%">
          <stop offset="0%" stopColor="oklch(0.97 0.02 80)" />
          <stop offset="55%" stopColor="oklch(0.88 0.045 55)" />
          <stop offset="100%" stopColor="oklch(0.78 0.06 35)" />
        </radialGradient>
        <radialGradient id="lona-sheen" cx="32%" cy="22%" r="35%">
          <stop offset="0%" stopColor="oklch(1 0 0 / 0.85)" />
          <stop offset="100%" stopColor="oklch(1 0 0 / 0)" />
        </radialGradient>
        <linearGradient id="lona-ink" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="oklch(0.28 0.04 30)" />
          <stop offset="100%" stopColor="oklch(0.18 0.03 30)" />
        </linearGradient>
        <radialGradient id="lona-disc-only" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="oklch(0.97 0.02 80)" />
          <stop offset="60%" stopColor="oklch(0.88 0.045 55)" />
          <stop offset="100%" stopColor="oklch(0.78 0.06 35)" />
        </radialGradient>
      </defs>

      {variant !== "wordmark" && (
        <g>
          <circle cx="100" cy="100" r="96" fill="url(#lona-pearl)" />
          <circle cx="100" cy="100" r="96" fill="url(#lona-sheen)" />
          <circle
            cx="100"
            cy="100"
            r="95"
            fill="none"
            stroke="oklch(1 0 0 / 0.55)"
            strokeWidth="1"
          />
        </g>
      )}

      {variant !== "mark" && (
        <text
          x="100"
          y="118"
          textAnchor="middle"
          fontFamily="'Cormorant Garamond','Fraunces','Times New Roman',serif"
          fontSize="44"
          fontWeight="500"
          fill="url(#lona-ink)"
          letterSpacing="6"
        >
          LONA
        </text>
      )}

      {variant !== "wordmark" && (
        <g
          transform="translate(100 100)"
          fill="oklch(0.42 0.07 35)"
          style={{
            transformOrigin: "center",
            animation: isStatic ? undefined : "lona-sparkle 4.2s ease-in-out infinite",
          }}
        >
          <path d="M0,-5.2 C0.6,-1.8 1.8,-0.6 5.2,0 C1.8,0.6 0.6,1.8 0,5.2 C-0.6,1.8 -1.8,0.6 -5.2,0 C-1.8,-0.6 -0.6,-1.8 0,-5.2 Z" />
          <circle r="0.9" />
        </g>
      )}

      <style>{`
        @keyframes lona-sparkle {
          0%, 100% { opacity: 0.7; transform: translate(100px,100px) scale(0.92); }
          50% { opacity: 1; transform: translate(100px,100px) scale(1.06); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-lona-sparkle], g[transform] { animation: none !important; }
        }
      `}</style>
    </svg>
  );
}

/**
 * Compact monogram-only logo for navigation chrome and the admin shell.
 */
export function LonaMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return <LonaLogo variant="mark" size={size} className={className} />;
}

/**
 * Horizontal wordmark (no disc). Use in footers and email signatures.
 */
export function LonaWordmark({
  height = 24,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return <LonaLogo variant="wordmark" size={height} className={className} />;
}
