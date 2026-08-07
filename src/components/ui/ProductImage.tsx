import { useEffect, useState } from "react";
import { cn, type GradientKey } from "@/lib/glass";
import { LONA_MOCK_FALLBACK } from "@/data/mock-images";
import { LonaLogo } from "@/components/brand/LonaLogo";

/** Accept either the unprefixed key ("mist") or the full class ("gradient-mist"). */
type GradientInput =
  | GradientKey
  | "gradient-mist"
  | "gradient-oat"
  | "gradient-rose-quartz"
  | "gradient-deep";

const gradientClass = (value: GradientInput): string =>
  value.startsWith("gradient-") ? value : `gradient-${value}`;

interface ProductImageProps {
  gradient?: GradientInput;
  className?: string;
  /**
   * Garment silhouette. The Aeon/Æon outerwear/knitwear taxonomy is preserved
   * alongside the LONA lingerie taxonomy (bra · brief · robe · tee · bodysuit).
   */
  silhouette?:
    | "coat"
    | "knit"
    | "trouser"
    | "shirt"
    | "dress"
    | "leather"
    | "accessory"
    | "bra"
    | "brief"
    | "robe"
    | "tee"
    | "bodysuit";
  alt?: string;
  /** Floating "L" wordmark ratio */
  withMark?: boolean;
  /**
   * Phase 5.8.1 — real URL passthrough.
   * When provided, the component renders an `<img>` over the
   * gradient + silhouette base layer. If the URL fails to load
   * the visual falls back to the branded gradient/silhouette so
   * the visitor never sees a blank plate.
   */
  src?: string;
  /** Optional responsive source for `<img srcSet>`. */
  srcSet?: string;
  sizes?: string;
  /** Eager-load above-the-fold imagery. Defaults to lazy. */
  priority?: boolean;
}

const silhouetteFor = (s: ProductImageProps["silhouette"]) => {
  switch (s) {
    case "coat":
      return (
        <svg
          viewBox="0 0 120 200"
          aria-hidden="true"
          className="absolute inset-0 m-auto h-[78%] w-[42%] drop-shadow-[0_18px_30px_rgba(20,30,55,0.12)]"
        >
          <path
            d="M60 12c8 0 14 6 14 14s-6 14-14 14-14-6-14-14 6-14 14-14zm-22 38l-22 18 6 22v88h76V90l6-22-22-18c-4 6-12 10-22 10s-18-4-22-10z"
            fill="currentColor"
            opacity="0.78"
          />
        </svg>
      );
    case "knit":
      return (
        <svg
          viewBox="0 0 120 200"
          aria-hidden="true"
          className="absolute inset-0 m-auto h-[72%] w-[44%] drop-shadow-[0_18px_30px_rgba(20,30,55,0.12)]"
        >
          <path
            d="M60 14c8 0 12 5 12 12v8c10 4 16 14 16 24v104c0 8-6 14-14 14H46c-8 0-14-6-14-14V58c0-10 6-20 16-24v-8c0-7 4-12 12-12z"
            fill="currentColor"
            opacity="0.78"
          />
        </svg>
      );
    case "trouser":
      return (
        <svg
          viewBox="0 0 120 200"
          aria-hidden="true"
          className="absolute inset-0 m-auto h-[84%] w-[36%] drop-shadow-[0_18px_30px_rgba(20,30,55,0.12)]"
        >
          <path
            d="M30 14h60l-4 70-2 102H70l-4-90h-12l-4 90H36L34 84z"
            fill="currentColor"
            opacity="0.78"
          />
        </svg>
      );
    case "shirt":
      return (
        <svg
          viewBox="0 0 120 200"
          aria-hidden="true"
          className="absolute inset-0 m-auto h-[78%] w-[46%] drop-shadow-[0_18px_30px_rgba(20,30,55,0.12)]"
        >
          <path
            d="M60 12l-22 8-22 14 12 24 12-4v124h40V54l12 4 12-24-22-14z"
            fill="currentColor"
            opacity="0.78"
          />
        </svg>
      );
    case "dress":
      return (
        <svg
          viewBox="0 0 120 200"
          aria-hidden="true"
          className="absolute inset-0 m-auto h-[88%] w-[42%] drop-shadow-[0_18px_30px_rgba(20,30,55,0.12)]"
        >
          <path
            d="M60 12c7 0 12 5 12 12v6l16 4 8 60 8 92H16l8-92 8-60 16-4v-6c0-7 5-12 12-12z"
            fill="currentColor"
            opacity="0.78"
          />
        </svg>
      );
    case "leather":
      return (
        <svg
          viewBox="0 0 120 200"
          aria-hidden="true"
          className="absolute inset-0 m-auto h-[60%] w-[60%] drop-shadow-[0_18px_30px_rgba(20,30,55,0.12)]"
        >
          <path
            d="M16 70c0-30 22-54 44-54s44 24 44 54v6H16v-6zm4 14h80v40c0 14-12 26-30 26H50c-18 0-30-12-30-26V84z"
            fill="currentColor"
            opacity="0.78"
          />
        </svg>
      );
    case "accessory":
      return (
        <svg
          viewBox="0 0 120 200"
          aria-hidden="true"
          className="absolute inset-0 m-auto h-[44%] w-[60%] drop-shadow-[0_18px_30px_rgba(20,30,55,0.12)]"
        >
          <rect
            x="20"
            y="60"
            width="80"
            height="80"
            rx="8"
            fill="currentColor"
            opacity="0.78"
          />
        </svg>
      );
    case "bra":
      return (
        <svg
          viewBox="0 0 120 200"
          aria-hidden="true"
          className="absolute inset-0 m-auto h-[58%] w-[62%] drop-shadow-[0_18px_30px_rgba(20,30,55,0.12)]"
        >
          <path
            d="M20 60c0-8 8-14 18-14 6 0 12 4 16 12 2 4 4 6 6 6s4-2 6-6c4-8 10-12 16-12 10 0 18 6 18 14 0 16-12 30-40 30S20 76 20 60zm4 24c12 12 32 14 36 14s24-2 36-14l-4 24c-4 14-16 22-32 22s-28-8-32-22l-4-24z"
            fill="currentColor"
            opacity="0.78"
          />
        </svg>
      );
    case "brief":
      return (
        <svg
          viewBox="0 0 120 200"
          aria-hidden="true"
          className="absolute inset-0 m-auto h-[40%] w-[58%] drop-shadow-[0_18px_30px_rgba(20,30,55,0.12)]"
        >
          <path
            d="M28 80h64c4 0 8 4 8 10v30c0 18-18 28-40 28s-40-10-40-28V90c0-6 4-10 8-10zm-4 28h72"
            fill="currentColor"
            opacity="0.78"
          />
        </svg>
      );
    case "robe":
      return (
        <svg
          viewBox="0 0 120 200"
          aria-hidden="true"
          className="absolute inset-0 m-auto h-[84%] w-[46%] drop-shadow-[0_18px_30px_rgba(20,30,55,0.12)]"
        >
          <path
            d="M60 14c6 0 10 4 10 10v6l16 6 16 60 6 90H12l6-90 16-60 16-6v-6c0-6 4-10 10-10z"
            fill="currentColor"
            opacity="0.78"
          />
        </svg>
      );
    case "tee":
      return (
        <svg
          viewBox="0 0 120 200"
          aria-hidden="true"
          className="absolute inset-0 m-auto h-[68%] w-[54%] drop-shadow-[0_18px_30px_rgba(20,30,55,0.12)]"
        >
          <path
            d="M60 14l-22 4-28 14 8 24 16-4v116h52V52l16 4 8-24-28-14z"
            fill="currentColor"
            opacity="0.78"
          />
        </svg>
      );
    case "bodysuit":
      return (
        <svg
          viewBox="0 0 120 200"
          aria-hidden="true"
          className="absolute inset-0 m-auto h-[84%] w-[42%] drop-shadow-[0_18px_30px_rgba(20,30,55,0.12)]"
        >
          <path
            d="M60 12l-18 6c-14 6-22 16-22 30v20h-8v60c0 14 10 22 24 22h8v40h32v-40h8c14 0 24-8 24-22v-60h-8V48c0-14-8-24-22-30z"
            fill="currentColor"
            opacity="0.78"
          />
        </svg>
      );
    default:
      return null;
  }
};

export function ProductImage({
  gradient = "mist",
  className,
  silhouette = "coat",
  withMark = true,
  src,
  srcSet,
  sizes,
  priority = false,
  alt,
  ...rest
}: ProductImageProps) {
  const [imageSrc, setImageSrc] = useState(src ?? LONA_MOCK_FALLBACK);

  useEffect(() => {
    setImageSrc(src ?? LONA_MOCK_FALLBACK);
  }, [src]);

  return (
    <div
      {...rest}
      className={cn(
        "relative aspect-[4/5] w-full overflow-hidden rounded-xl",
        gradientClass(gradient),
        className
      )}
    >
      {/* Soft highlight ring */}
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/40" />
      {/* Silhouette — sits beneath the photo so it remains the branded fallback */}
      <div className="text-ink/55">{silhouetteFor(silhouette)}</div>
      {/* Real product photography — falls back to the silhouette on error */}
      <img
          src={imageSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt ?? ""}
          width={800}
          height={1000}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          onError={(e) => {
            // Switch to local mock artwork before falling back to the branded silhouette.
            if (imageSrc !== LONA_MOCK_FALLBACK) {
              setImageSrc(LONA_MOCK_FALLBACK);
              return;
            }
            const el = e.currentTarget;
            el.style.opacity = "0";
          }}
        />
      {withMark && (
        <LonaLogo
          variant="default"
          size={24}
          title="لوگوی لونا"
          className="absolute bottom-3 start-3 h-6 w-6 opacity-70"
        />
      )}
    </div>
  );
}
