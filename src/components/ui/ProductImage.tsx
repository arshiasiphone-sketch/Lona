import { cn, type GradientKey } from "@/lib/glass";

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
  /** "Mannequin" silhouette: coat, knit, trouser, dress, accessory */
  silhouette?: "coat" | "knit" | "trouser" | "shirt" | "dress" | "leather" | "accessory";
  alt?: string;
  /** Floating "Æ" wordmark ratio */
  withMark?: boolean;
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
    default:
      return null;
  }
};

export function ProductImage({
  gradient = "mist",
  className,
  silhouette = "coat",
  withMark = true,
  ...rest
}: ProductImageProps) {
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
      {/* Silhouette */}
      <div className="text-ink/55">{silhouetteFor(silhouette)}</div>
      {withMark && (
        <span className="absolute bottom-3 left-3 font-display text-[10px] tracking-[0.4em] text-ink/50">
          ÆON
        </span>
      )}
    </div>
  );
}
