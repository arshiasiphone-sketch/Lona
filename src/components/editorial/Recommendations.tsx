import { ProductGrid } from "@/components/product/ProductGrid";
import { products } from "@/data/catalog";

/**
 * Placeholder / architecture for personalization.
 * When the personalization service goes live, replace the static ids with
 * results from the recommendation query. The contract (props in, products out)
 * stays identical.
 */
export function Recommendations() {
  // Curated picks — would come from server recommendations in production.
  const picks = products.filter((p) =>
    ["p-002", "p-007", "p-005", "p-009"].includes(p.id)
  );

  return (
    <section className="mx-auto mt-32 max-w-[1728px] px-6 lg:px-10">
      <div className="flex items-end justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">Considered for you</p>
          <h2 className="mt-3 font-display text-3xl leading-[1.02] text-ink lg:text-5xl">
            From your last visits
          </h2>
        </div>
        <p className="hidden max-w-md text-xs text-ink-muted md:block md:text-right">
          A small list curated by our atelier. Personalized recommendations
          will arrive in the next release.
        </p>
      </div>
      <div className="mt-12">
        <ProductGrid products={picks} columns={4} />
      </div>
    </section>
  );
}
