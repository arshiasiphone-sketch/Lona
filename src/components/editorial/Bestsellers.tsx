/**
 * Lona — Bestsellers grid.
 *
 * 4-up product grid with Persian copy. Replaces the placeholder
 * `Recommendations` component on the homepage. In production this
 * should be driven by an admin-flagged bestseller list or a real
 * recommendation service — for now it reads the static fallback.
 */
import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product } from "@/data/catalog";

interface Props {
  products: Product[];
  eyebrow?: string;
  title?: string;
  ctaLabel?: string;
  ctaTo?: string;
}

export function Bestsellers({
  products,
  eyebrow = "پرفروش‌ها",
  title = "آنچه مشتریان ما بیشتر سفارش داده‌اند",
  ctaLabel = "مشاهده همه",
  ctaTo = "/shop",
}: Props) {
  return (
    <section
      className="mx-auto mt-36 max-w-[1728px] px-6 lg:px-10"
      aria-label={eyebrow}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">{eyebrow}</p>
          <h2 className="mt-3 font-display text-4xl font-light leading-[1.08] text-ink lg:text-5xl">
            {title}
          </h2>
        </div>
        <a
          href={ctaTo}
          className="self-start font-sans text-[12px] font-medium text-ink-soft transition hover:text-ink md:self-end"
        >
          <span className="border-b border-ink/30 pb-0.5 transition hover:border-ink">
            {ctaLabel}
          </span>
        </a>
      </div>
      <div className="mt-12">
        <ProductGrid products={products.slice(0, 4)} columns={4} priority />
      </div>
    </section>
  );
}