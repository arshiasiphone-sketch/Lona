import type { Product, ProductColor, ProductSize } from "@/data/catalog";
import { cn } from "@/lib/glass";

interface VariantPickerProps {
  product: Product;
  selectedColor: string;
  selectedSize: string;
  onColorChange: (id: string) => void;
  onSizeChange: (id: string) => void;
}

export function VariantPicker({
  product,
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
}: VariantPickerProps) {
  const isLimited = product.badges?.includes("limited");
  const inStock = true; // mock catalogue — all in stock by default

  return (
    <>
      {/* Color */}
      <div>
        <div className="flex items-center justify-between">
          <p className="type-eyebrow text-ink-muted">رنگ</p>
          <p className="text-xs text-ink">
            {product.colors.find((c) => c.id === selectedColor)?.name ?? ""}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {product.colors.map((c: ProductColor) => (
            <ColorChip
              key={c.id}
              color={c}
              active={selectedColor === c.id}
              onClick={() => onColorChange(c.id)}
            />
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <div className="flex items-center justify-between">
          <p className="type-eyebrow text-ink-muted">سایز</p>
          <button className="text-xs uppercase tracking-[0.18em] text-ink-soft underline-offset-4 hover:underline">
            Size guide
          </button>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {product.sizes.map((s: ProductSize) => (
            <button
              key={s.id}
              onClick={() => onSizeChange(s.id)}
              className={cn(
                "rounded-xl py-2.5 text-[11px] uppercase tracking-[0.18em] transition",
                selectedSize === s.id
                  ? "bg-ink text-canvas"
                  : "hairline text-ink-soft hover:bg-white/60 hover:text-ink"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stock indicator */}
      <div className="flex items-center gap-2 text-xs">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            inStock
              ? isLimited
                ? "bg-primary animate-pulse"
                : "bg-primary"
              : "bg-ink-muted"
          )}
        />
        <span className={cn("text-ink-soft")}>
          {inStock
            ? isLimited
              ? "Limited run · last pieces"
              : "In stock · ships within 48h"
            : "Out of stock — restocking next season"}
        </span>
      </div>
    </>
  );
}

function ColorChip({
  color,
  active,
  onClick,
}: {
  color: ProductColor;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative h-12 w-12 rounded-full ring-1 ring-inset ring-edge transition",
        color.gradient === "oat" && "gradient-oat",
        color.gradient === "mist" && "gradient-mist",
        color.gradient === "deep" && "gradient-deep",
        color.gradient === "rose" && "gradient-rose-quartz"
      )}
      aria-pressed={active}
      aria-label={color.name}
    >
      <span
        className={cn(
          "absolute inset-0 rounded-full ring-2 ring-offset-2 ring-offset-canvas transition",
          active ? "ring-ink" : "ring-transparent"
        )}
      />
    </button>
  );
}
