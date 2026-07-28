import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { products } from "@/data/catalog";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/glass";
import { Reveal } from "@/components/motion/Reveal";

const silhouetteFor = (cat: string) => {
  switch (cat) {
    case "outerwear":
      return "coat" as const;
    case "knitwear":
      return "knit" as const;
    case "trousers":
      return "trouser" as const;
    case "shirting":
      return "shirt" as const;
    case "dresses":
      return "dress" as const;
    case "leather":
      return "leather" as const;
    default:
      return "accessory" as const;
  }
};

const gradientFor = (k: string) =>
  k === "oat"
    ? "gradient-oat"
    : k === "deep"
    ? "gradient-deep"
    : k === "rose"
    ? "gradient-rose-quartz"
    : "gradient-mist";

interface RecentlyViewedProps {
  title?: string;
  eyebrow?: string;
  excludeId?: string;
  /** max items */
  limit?: number;
  className?: string;
}

export function RecentlyViewed({
  title = "آخرین بازدیدها",
  eyebrow = "ادامه ببینید",
  excludeId,
  limit = 6,
  className,
}: RecentlyViewedProps) {
  const { ids } = useRecentlyViewed();

  const items = ids
    .filter((id) => id !== excludeId)
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, limit);

  if (items.length === 0) return null;

  return (
    <Reveal as="section" className={cn("mt-24", className)}>
      <div className="flex items-end justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">{eyebrow}</p>
          <h2 className="mt-3 type-h2 text-ink">{title}</h2>
        </div>
        <Link
          to="/wishlist"
          className="type-button text-ink-soft hover:text-ink"
        >
          مشاهده علاقه‌مندی‌ها
          <ArrowLeft className="ms-2 inline h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-10 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {items.map((p) => (
          <Link
            key={p.id}
            to={`/shop/${p.slug}`}
            className="group focus-luxury block overflow-hidden rounded-xl"
          >
            <div className="relative aspect-[4/5] w-full">
              <div className={cn("absolute inset-0", gradientFor(p.colors[0].gradient))}>
                <ProductImage
                  gradient={p.colors[0].gradient}
                  silhouette={silhouetteFor(p.category)}
                  withMark={false}
                  className="h-full w-full"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/35" />
            </div>
            <p className="mt-3 line-clamp-1 text-sm font-medium text-ink group-hover:text-primary">
              {p.name}
            </p>
            <p className="type-caption text-ink-muted">
              {p.price.toLocaleString("fa-IR")} تومان
            </p>
          </Link>
        ))}
      </div>
    </Reveal>
  );
}

export function RecentlyViewedStrip({
  title = "آخرین بازدیدها",
  eyebrow = "از آخرین بازدیدهای شما",
  excludeId,
  className,
}: RecentlyViewedProps) {
  const { ids } = useRecentlyViewed();
  const items = ids
    .filter((id) => id !== excludeId)
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 8);

  if (items.length === 0) {
    return (
      <section className={cn("mt-24", className)}>
        <p className="type-eyebrow text-ink-muted">{eyebrow}</p>
        <h2 className="mt-3 type-h2 text-ink">{title}</h2>
        <p className="mt-4 max-w-sm text-sm text-ink-muted">
          تکه‌هایی که مرور می‌کنید، اینجا نشان داده می‌شوند. هنوز چیزی انتخاب نکرده‌اید.
        </p>
      </section>
    );
  }

  return (
    <section className={cn("mt-24", className)}>
      <p className="type-eyebrow text-ink-muted">{eyebrow}</p>
      <h2 className="mt-3 type-h2 text-ink">{title}</h2>
      <div className="scroll-luxe mt-8 flex gap-5 overflow-x-auto pb-4">
        {items.map((p) => (
          <Link key={p.id} to={`/shop/${p.slug}`} className="block w-44 shrink-0">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl">
              <div className={cn("absolute inset-0", gradientFor(p.colors[0].gradient))}>
                <ProductImage
                  gradient={p.colors[0].gradient}
                  silhouette={silhouetteFor(p.category)}
                  withMark={false}
                  className="h-full w-full"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/35" />
            </div>
            <p className="mt-3 line-clamp-1 text-sm text-ink">{p.name}</p>
            <p className="type-caption text-ink-muted">
              {p.price.toLocaleString("fa-IR")} تومان
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}