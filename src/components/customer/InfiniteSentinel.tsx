import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Skeleton } from "@/components/ui/skeleton";

interface InfiniteSentinelProps {
  onLoad: () => void;
  hasMore: boolean;
}

export function InfiniteSentinel({ onLoad, hasMore }: InfiniteSentinelProps) {
  const { ref, inView } = useInView({ rootMargin: "200px 0px", threshold: 0 });

  useEffect(() => {
    if (inView && hasMore) onLoad();
  }, [inView, hasMore, onLoad]);

  if (!hasMore) return null;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="mt-16 flex flex-col items-center gap-3"
    >
      <Skeleton className="h-3 w-32" />
      <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
        The next page is on its way
      </p>
    </div>
  );
}
