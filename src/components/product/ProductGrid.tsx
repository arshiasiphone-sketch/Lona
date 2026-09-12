import type { Product as TProduct } from "@/data/catalog";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: TProduct[];
  columns?: 2 | 3 | 4;
  className?: string;
  /** When true, first 4 cards animate without intersection delay */
  priority?: boolean;
  /** Show two products per row on mobile instead of one. */
  mobileTwoUp?: boolean;
}

export function ProductGrid({
  products,
  columns = 4,
  className,
  priority,
  mobileTwoUp,
}: ProductGridProps) {
  const cols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[columns];
  const baseCols = mobileTwoUp ? "grid-cols-2" : "grid-cols-1";

  return (
    <div className={`grid ${baseCols} gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-14 ${cols} ${className ?? ""}`}>
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={priority && i < 4} />
      ))}
    </div>
  );
}
