import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { ProductImage } from "@/components/ui/ProductImage";
import { getProductById } from "@/data/catalog";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/glass";
import { toast } from "@/lib/toast";
import { useCart } from "@/hooks/use-cart";
import { EASE_LUXURY } from "@/lib/motion";

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
  k === "oat" ? "gradient-oat" : k === "deep" ? "gradient-deep" : k === "rose" ? "gradient-rose-quartz" : "gradient-mist";

const CO_OCCURRENCES: Record<string, string[]> = {
  "p-001": ["p-002", "p-003"],
  "p-002": ["p-001", "p-003"],
  "p-003": ["p-001", "p-004"],
  "p-004": ["p-003", "p-009"],
  "p-005": ["p-007", "p-011"],
  "p-006": ["p-005", "p-008"],
  "p-007": ["p-005", "p-011"],
  "p-008": ["p-006", "p-009"],
  "p-009": ["p-002", "p-004"],
  "p-010": ["p-002", "p-004"],
  "p-011": ["p-005", "p-007"],
  "p-012": ["p-002", "p-004"],
};

interface BundleSuggestionsProps {
  primaryId: string;
}

export function BundleSuggestions({ primaryId }: BundleSuggestionsProps) {
  const ids = CO_OCCURRENCES[primaryId] ?? ["p-002", "p-004"];
  const items = [primaryId, ...ids]
    .map((id) => getProductById(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set<string>([primaryId, ...ids])
  );
  const [pickExtras, setPickExtras] = useState(false);
  const { add } = useCart();

  const included = items.filter((p) => picked.has(p.id));
  const subtotal = included.reduce((sum, p) => sum + p.price, 0);
  const discountPct = pickExtras ? 0.1 : 0;
  const total = subtotal * (1 - discountPct);

  const toggle = (id: string) => {
    if (id === primaryId) return;
    setPicked((curr) => {
      const next = new Set(curr);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addAll = () => {
    included.forEach((p) =>
      add({
        productId: p.id,
        size: p.sizes[0].label,
        color: p.colors[0].name,
        quantity: 1,
      })
    );
    toast.added(`${included.length} pieces · the bundle`);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: EASE_LUXURY }}
      className="mt-16"
    >
      <div className="flex items-end justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">Considered Together</p>
          <h2 className="mt-3 font-display text-3xl text-ink lg:text-4xl">
            Frequently with
          </h2>
        </div>
        <span className="text-xs text-ink-muted">
          Customers often add these together.
        </span>
      </div>

      <div className="mt-8 grid gap-4 rounded-3xl glass-strong p-6 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-center">
        {items.map((p, i) => (
          <div key={p.id} className="flex items-center gap-4">
            {i > 0 && (
              <Plus
                className={cn(
                  "h-4 w-4 shrink-0",
                  picked.has(p.id) ? "text-primary" : "text-ink-muted"
                )}
              />
            )}
            <label
              className={cn(
                "flex flex-1 cursor-pointer items-center gap-4 rounded-2xl bg-canvas/60 p-3 ring-1 ring-inset ring-white/35 transition hover:bg-white/80",
                picked.has(p.id) && "ring-primary"
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 place-items-center rounded-full border-2 transition",
                  picked.has(p.id) ? "border-primary bg-primary text-canvas" : "border-edge"
                )}
              >
                {picked.has(p.id) && <Check className="h-3 w-3" />}
              </span>
              <div className="h-16 w-12 overflow-hidden rounded-lg">
                <ProductImage
                  gradient={p.colors[0].gradient}
                  silhouette={silhouetteFor(p.category)}
                  withMark={false}
                  className="h-full w-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-ink">{p.name}</p>
                <p className="text-xs text-ink-muted">{formatPrice(p.price)}</p>
              </div>
              {p.id !== primaryId && (
                <input
                  type="checkbox"
                  checked={picked.has(p.id)}
                  onChange={() => toggle(p.id)}
                  className="sr-only"
                />
              )}
            </label>
          </div>
        ))}

        <div className="flex flex-col items-end gap-3 lg:border-l lg:border-edge/60 lg:pl-6">
          <div className="text-right">
            <p className="type-eyebrow text-ink-muted">Together</p>
            <p className="font-display text-2xl text-ink type-caption">
              {formatPrice(total)}
            </p>
            {pickExtras && (
              <p className="text-[11px] uppercase tracking-[0.18em] text-primary">
                −10% with bundle
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setPickExtras(true);
              addAll();
            }}
            className="rounded-full bg-ink px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary"
          >
            Add Selection
          </button>
        </div>
      </div>
    </motion.section>
  );
}
