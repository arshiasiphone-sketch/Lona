import type { Product as TProduct } from "@/data/catalog";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: TProduct[];
  columns?: 2 | 3 | 4;
  className?: string;
  /** When true, first 4 cards animate without intersection delay */
  priority?: boolean;
}

export function ProductGrid({ products, columns = 4, className, priority }: ProductGridProps) {
  const cols = {
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
  }[columns];

  return (
    <div className={`grid grid-cols-2 gap-x-6 gap-y-12 sm:gap-x-8 sm:gap-y-16 ${cols} ${className ?? ""}`}>
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={priority && i < 4} />
      ))}
    </div>
  );
}
