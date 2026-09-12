/**
 * Phase 5.2 — ProductPickerDialog.
 *
 * Shared by:
 *   • `/admin/categories` — assign products to a category.
 *   • The product workflow — assign + reorder products (the
 *     ordered list mode is selected via `mode="ordered"`, which
 *     uses framer-motion `Reorder.Group` so RTL drag works out
 *     of the box).
 *
 * Search runs server-side via `api.products.search` so the
 * picker scales beyond local filtering. Returns a stable id list
 * via `onResolve`; the parent is responsible for the actual
 * Convex mutation.
 */
import * as React from "react";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { Reorder, motion, AnimatePresence } from "framer-motion";
import { Check, GripVertical, Search, X } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { EASE_LUXURY } from "@/lib/motion";
import { cn } from "@/lib/glass";
import { formatPrice } from "@/lib/format";

export interface ProductPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "checkbox" | "ordered";
  initialIds?: Id<"products">[];
  title?: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  emptyLabel?: string;
  onResolve: (ids: Id<"products">[]) => void | Promise<void>;
}

type ProductSummary = Pick<
  Doc<"products">,
  "_id" | "slug" | "name" | "priceCents" | "category"
> & { badge?: string };

export function ProductPickerDialog({
  open,
  onOpenChange,
  mode = "checkbox",
  initialIds = [],
  title = "انتخاب محصولات",
  body,
  confirmLabel = "تأیید انتخاب",
  emptyLabel = "محصولی یافت نشد",
  onResolve,
}: ProductPickerDialogProps) {
  const [term, setTerm] = React.useState("");
  const [selected, setSelected] = React.useState<Id<"products">[]>(initialIds);
  const [busy, setBusy] = React.useState(false);

  // Re-buffer initial ids whenever the dialog opens fresh.
  React.useEffect(() => {
    if (open) setSelected(initialIds);
  }, [open, initialIds]);

  // Pull the live admin product list once; the picker scales fine
  // for the admin team size (full list is filtered client-side).
  const catalog = useQuery(api.admin_products.listForAdmin, {});
  const search = useMemo(() => {
    if (!catalog) return undefined;
    const needle = term.trim().toLowerCase();
    if (!needle) return catalog;
    return catalog.filter((row) =>
      [row.name, row.slug, row.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [catalog, term]);

  const stableSearch: ProductSummary[] = (search ?? []) as ProductSummary[];

  const togglePick = (id: Id<"products">) => {
    setSelected((prev) => {
      const has = prev.includes(id);
      if (mode === "ordered") {
        // ordered mode: append to end (and inject at end if new)
        return has ? prev.filter((x) => x !== id) : [...prev, id];
      }
      return has ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  const reorderInPlace = (next: Id<"products">[]) => {
    setSelected(next);
  };

  const selectedProducts = useQuery(
    api.admin_products.listForAdmin,
    selected.length > 0 ? {} : "skip",
  );

  const productIndex = React.useMemo(() => {
    const map = new Map<Id<"products">, ProductSummary>();
    (selectedProducts ?? []).forEach((p) => {
      map.set(p._id as Id<"products">, p as ProductSummary);
    });
    return map;
  }, [selectedProducts]);

  const orderedSelected: ProductSummary[] = selected.flatMap((id) => {
    const p = productIndex.get(id);
    return p ? [p] : [];
  });

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onResolve(selected);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="picker"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: EASE_LUXURY }}
          className="fixed inset-0 z-50 grid place-items-end bg-ink/30 px-4 pb-6 pt-12 backdrop-blur-md sm:place-items-center sm:p-8"
          dir="rtl"
          onClick={(e) => {
            if (e.target === e.currentTarget) onOpenChange(false);
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.35, ease: EASE_LUXURY }}
            className="w-full max-w-3xl overflow-hidden rounded-3xl border border-edge bg-white/95 shadow-2xl backdrop-blur-xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-edge px-7 py-6">
              <div className="text-start">
                <p className="type-eyebrow text-ink-muted">انتخاب محصولات</p>
                <h2 className="mt-2 font-display text-2xl text-ink">
                  {title}
                </h2>
                {body ? (
                  <p className="mt-2 max-w-lg text-sm text-ink-soft">
                    {body}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full hairline bg-white hover:bg-canvas-soft"
                aria-label="بستن"
              >
                <X className="h-3.5 w-3.5 text-ink" />
              </button>
            </header>

            {mode === "ordered" && orderedSelected.length > 0 ? (
              <div className="border-b border-edge bg-canvas-soft px-7 py-5">
                <p className="type-eyebrow text-ink-muted">ترتیب محصولات</p>
                <p className="mt-1 text-[11px] text-ink-soft">
                  با کشیدن می‌توانید ترتیب نمایش در فروشگاه را تغییر دهید.
                </p>
                <Reorder.Group
                  axis="y"
                  values={selected}
                  onReorder={reorderInPlace}
                  className="mt-3 space-y-1.5"
                >
                  {orderedSelected.map((p) => (
                    <Reorder.Item
                      key={p._id}
                      value={p._id}
                      className="flex items-center gap-3 rounded-2xl border border-edge bg-white px-3 py-2.5 text-sm"
                    >
                      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-ink-muted" />
                      <span className="hidden h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-md bg-canvas-soft sm:grid" />
                      <span className="flex-1 truncate text-ink">
                        {p.name}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                        {p.category}
                      </span>
                      <span className="type-caption text-ink">
                        {p.priceCents > 0
                          ? formatPrice(p.priceCents)
                          : "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePick(p._id)}
                        className="grid h-8 w-8 place-items-center rounded-full hairline bg-white hover:bg-rose-50"
                        aria-label="حذف از فهرست"
                      >
                        <X className="h-3.5 w-3.5 text-ink-soft" />
                      </button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            ) : null}

            <div className="border-b border-edge px-7 py-4">
              <div className="flex items-center gap-2 rounded-full hairline bg-canvas/70 px-3 py-1.5">
                <Search className="h-3.5 w-3.5 text-ink-muted" />
                <input
                  type="search"
                  placeholder="جست‌وجوی محصول (نام، اسلاگ، دسته)…"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                />
              </div>
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                {selected.length.toLocaleString("fa-IR")} انتخاب شده
              </p>
            </div>

            <div className="max-h-[40vh] overflow-y-auto px-7 py-4">
              {stableSearch.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-edge bg-canvas-soft px-6 py-12 text-center text-sm text-ink-muted">
                  {term.trim().length >= 2 ? emptyLabel : "برای جست‌وجو تایپ کنید…"}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {stableSearch.map((row) => {
                    const isPicked = selected.includes(row._id);
                    return (
                      <li key={row._id}>
                        <button
                          type="button"
                          onClick={() => togglePick(row._id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-start text-sm transition",
                            isPicked
                              ? "border-primary bg-primary/8 text-ink"
                              : "border-edge bg-white/70 text-ink-soft hover:bg-white",
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-7 w-7 shrink-0 place-items-center rounded-md border",
                              isPicked
                                ? "border-primary bg-primary text-canvas"
                                : "border-edge bg-white text-ink-muted",
                            )}
                          >
                            {isPicked ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : null}
                          </span>
                          <span className="flex-1 truncate text-ink">
                            {row.name}
                          </span>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                            {row.category}
                          </span>
                          <span className="type-caption text-ink">
                            {row.priceCents > 0
                              ? formatPrice(row.priceCents)
                              : "—"}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-edge px-7 py-5">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full hairline bg-canvas/70 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-white"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary disabled:opacity-60"
              >
                {busy ? "در حال ذخیره…" : confirmLabel}
              </button>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
