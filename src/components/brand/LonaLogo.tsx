/**
 * Shared LONA brand logo.
 *
 * The artwork is intentionally rendered as an image rather than inline SVG:
 * the same source is used by the header, footer, auth, admin, invoices and
 * browser chrome, and image isolation prevents SVG id collisions.
 */
import { cn } from "@/lib/glass";

type Variant = "default" | "wordmark" | "mark" | "inverse";

interface LonaLogoProps {
  variant?: Variant;
  size?: number;
  className?: string;
  title?: string;
}

const DEFAULT_LABEL: Record<Variant, string> = {
  default: "لوگوی لونا",
  wordmark: "لوگوی لونا",
  mark: "نشان لونا",
  inverse: "لوگوی لونا",
};

const LOGO_SRC = "/logo.svg";

export function LonaLogo({
  variant = "default",
  size = 36,
  className,
  title,
}: LonaLogoProps) {
  const aria = title ?? DEFAULT_LABEL[variant];
  const width = variant === "wordmark" ? Math.round(size * 1.9) : size;

  return (
    <img
      src={LOGO_SRC}
      alt={aria}
      width={width}
      height={size}
      decoding="async"
      draggable={false}
      className={cn("select-none object-contain", className)}
    />
  );
}

/** Compact shared logo for navigation and admin chrome. */
export function LonaMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return <LonaLogo variant="mark" size={size} className={className} />;
}

/** Shared logo asset in the wider slot used by email/signature surfaces. */
export function LonaWordmark({
  height = 24,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return <LonaLogo variant="wordmark" size={height} className={className} />;
}
