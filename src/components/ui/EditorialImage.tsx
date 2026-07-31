import type { ReactNode } from "react";
import { cn } from "@/lib/glass";

interface EditorialImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
  priority?: boolean;
  children?: ReactNode;
}

/**
 * Editorial imagery for homepage and campaign plates.
 * The fallback remains visible if a temporary remote mock URL fails.
 */
export function EditorialImage({
  src,
  alt,
  className,
  imgClassName,
  fallbackClassName = "gradient-lona-pearl",
  priority = false,
  children,
}: EditorialImageProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div aria-hidden className={cn("absolute inset-0", fallbackClassName)} />
      <img
        src={src}
        alt={alt}
        width={1400}
        height={1750}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        draggable={false}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
          imgClassName,
        )}
        onError={(event) => {
          event.currentTarget.style.opacity = "0";
        }}
      />
      {children}
    </div>
  );
}
