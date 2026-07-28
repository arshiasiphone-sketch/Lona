import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/data/catalog";
import { ProductGrid } from "@/components/product/ProductGrid";

interface Props {
  products: Product[];
  title?: string;
  eyebrow?: string;
  ctaLabel?: string;
  ctaTo?: string;
}

export function TrendingProducts({
  products,
  title = "Newly considered",
  eyebrow = "New Arrivals",
  ctaLabel = "View all",
  ctaTo = "/shop",
}: Props) {
  return (
    <section className="mx-auto mt-32 max-w-[1728px] px-6 lg:px-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">{eyebrow}</p>
          <h2 className="mt-3 font-display text-4xl leading-[1.05] text-ink lg:text-6xl">
            {title}
          </h2>
        </div>
        <Link
          to={ctaTo}
          className="group inline-flex items-center self-start gap-2 rounded-full glass-subtle px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink transition hover:bg-white/60 md:self-end"
        >
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
        </Link>
      </div>
      <div className="mt-14">
        <ProductGrid products={products.slice(0, 4)} columns={4} priority />
      </div>
    </section>
  );
}
