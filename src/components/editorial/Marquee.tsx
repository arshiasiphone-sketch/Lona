import { cn } from "@/lib/glass";

interface MarqueeProps {
  items: string[];
  speed?: number; // seconds for one full loop
  className?: string;
}

export function Marquee({ items, className }: MarqueeProps) {
  const doubled = [...items, ...items];
  return (
    <div
      className={cn(
        "relative overflow-hidden border-y border-edge bg-canvas-soft/60 py-6 backdrop-blur-sm",
        className
      )}
      aria-hidden="true"
    >
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="mx-10 font-display text-3xl font-light tracking-[-0.01em] text-ink-soft"
          >
            {item}
            <span className="mx-10 inline-block h-2 w-2 -translate-y-1.5 rounded-full bg-primary/60" />
          </span>
        ))}
      </div>
    </div>
  );
}
