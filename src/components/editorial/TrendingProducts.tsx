import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
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
  title = "کالکسیون جدید",
  eyebrow = "تازه‌ها",
  ctaLabel = "مشاهده همه",
  ctaTo = "/shop",
}: Props) {
  return (
    <section
      className="mx-auto mt-32 max-w-[1728px] px-6 lg:px-10"
      aria-label={eyebrow}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">{eyebrow}</p>
          <h2 className="mt-3 font-display text-4xl font-light leading-[1.08] text-ink lg:text-5xl">
            {title}
          </h2>
        </div>
        <Link
          to={ctaTo}
          className="group inline-flex items-center gap-2 self-start font-sans text-[12px] font-medium text-ink-soft transition hover:text-ink md:self-end"
        >
          <span className="border-b border-ink/30 pb-0.5 transition group-hover:border-ink">
            {ctaLabel}
          </span>
          <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-1" />
        </Link>
      </div>
      <div className="mt-14">
        <ProductGrid products={products.slice(0, 4)} columns={4} priority />
      </div>
    </section>
  );
}