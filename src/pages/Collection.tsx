import { Link, useParams } from "react-router";
import { ChevronRight } from "lucide-react";
import { getCollection, getCollectionProducts } from "@/data/catalog";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Marquee } from "@/components/editorial/Marquee";
import { cn } from "@/lib/glass";

export default function Collection() {
  const { slug = "" } = useParams();
  const collection = getCollection(slug);
  const items = getCollectionProducts(slug);

  if (!collection) {
    return (
      <div className="mx-auto max-w-2xl px-6 pt-32 pb-24 text-center">
        <h1 className="font-display text-3xl text-ink">Collection not found.</h1>
        <Link
          to="/collections"
          className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          All Collections
        </Link>
      </div>
    );
  }

  const gradientClass =
    collection.gradient === "oat"
      ? "gradient-oat"
      : collection.gradient === "mist"
      ? "gradient-mist"
      : collection.gradient === "rose"
      ? "gradient-rose-quartz"
      : "gradient-deep";
  const onDark = collection.gradient === "deep";

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative">
        <div
          className={cn(
            "relative mx-auto mt-12 flex h-[640px] max-w-[1728px] items-end overflow-hidden rounded-none px-6 lg:mt-16 lg:px-10"
          )}
        >
          <div className={cn("absolute inset-0", gradientClass)} />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/30" />
          <nav className="absolute left-6 top-6 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] lg:left-10 lg:top-10">
            <Link
              to="/collections"
              className={cn(
                "underline-offset-4 hover:underline",
                onDark ? "text-canvas/80" : "text-ink/70"
              )}
            >
              Collections
            </Link>
            <ChevronRight
              className={cn(
                "h-3 w-3",
                onDark ? "text-canvas/70" : "text-ink/60"
              )}
            />
            <span className={onDark ? "text-canvas" : "text-ink"}>
              {collection.name}
            </span>
          </nav>
          <div className="relative pb-16 text-canvas">
            <p
              className={cn(
                "type-eyebrow",
                onDark ? "text-canvas/80" : "text-ink/60"
              )}
            >
              {collection.eyebrow}
            </p>
            <h1
              className={cn(
                "mt-4 font-display text-6xl leading-[0.95] lg:text-9xl",
                onDark ? "text-canvas" : "text-ink"
              )}
            >
              {collection.name}
            </h1>
            <p
              className={cn(
                "mt-6 max-w-xl text-base leading-relaxed lg:text-lg",
                onDark ? "text-canvas/85" : "text-ink/75"
              )}
            >
              {collection.description}
            </p>
          </div>
        </div>
      </section>

      <Marquee
        items={[
          collection.name,
          `${items.length} pieces`,
          collection.eyebrow,
          "Made in Europe",
          "Limited run",
        ]}
        className="mt-0"
      />

      {/* Grid */}
      <section className="mx-auto max-w-[1728px] px-6 pb-24 pt-16 lg:px-10 lg:pb-32">
        <div className="flex items-end justify-between pb-10">
          <p className="type-eyebrow text-ink-muted">
            The Chapter · {items.length}
          </p>
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            Refined twice yearly
          </p>
        </div>
        <ProductGrid products={items} columns={3} />
      </section>
    </div>
  );
}
