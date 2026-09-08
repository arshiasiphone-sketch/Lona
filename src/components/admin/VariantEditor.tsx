/**
 * Phase 5.1 — VariantEditor.
 *
 * A flat size × colour table view. One row per (size, colour)
 * combination. Calls `api.admin_products.syncVariants` to reconcile
 * its in-memory state with the database:
 *
 *   • Rows the user keeps in the table → upsert.
 *   • Rows removed with `stock === 0 && reserved === 0` → deleted.
 *   • Rows removed with stock > 0 → flagged `available: false`
 *     (NEVER hard-deleted if there's stock, per the Phase-5 brief).
 *
 * The wizard renders a soft-disable warning so the admin can
 * confirm before publishing.
 */
import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, AlertCircle, Check, Save, RotateCcw } from "lucide-react";
import { EASE_LUXURY } from "@/lib/motion";
import { cn } from "@/lib/glass";
import type { Doc } from "@/convex/_generated/dataModel";
import { getAdminErrorMessage, withAdminTimeout } from "@/lib/admin-errors";

interface VariantEditorProps {
  productId: Id<"products">;
  /** Color labels seeded by the parent product's color picker. */
  colorIds: string[];
  /** Canonical size options seeded by the parent product's size picker. */
  sizeOptions: Array<{ id: string; label: string }>;
}

type Row = {
  size: string;
  color: string;
  sku: string;
  stock: number;
  priceCentsOverride?: number;
  available: boolean;
};

function buildKey(size: string, color: string) {
  return `${size}::${color}`;
}

export function VariantEditor({
  productId,
  colorIds,
  sizeOptions,
}: VariantEditorProps) {
  const live = useQuery(api.admin_products.listVariants, { productId });
  const sync = useMutation(api.admin_products.syncVariants);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [dirty, setDirty] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<{
    rows: number;
    softWarned: number;
  } | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const colorAxisKey = colorIds.join("|");
  const sizeAxisKey = sizeOptions.map((size) => size.id).join("|");
  const stableColorIds = React.useMemo(() => colorIds, [colorAxisKey]);
  const stableSizeOptions = React.useMemo(() => sizeOptions, [sizeAxisKey]);
  const sizeIds = React.useMemo(
    () => stableSizeOptions.map((size) => size.id),
    [stableSizeOptions],
  );
  const sizeLabelById = React.useMemo(
    () => new Map(stableSizeOptions.map((size) => [size.id, size.label])),
    [stableSizeOptions],
  );

  React.useEffect(() => {
    if (!live) return;

    // Step 1 is the only source of truth for the available axes. Keep
    // existing SKU/stock edits, remove rows for deselected options, and
    // create every newly-required combination automatically.
    const allowedKeys = new Set(
      sizeIds.flatMap((size) => stableColorIds.map((color) => buildKey(size, color))),
    );
    const existing = live
      .map((v: Doc<"variants">) => ({
        size: v.size,
        color: v.color,
        sku: v.sku,
        stock: v.stock,
        priceCentsOverride: v.priceCentsOverride,
        available: v.available,
      }))
      .filter((row) => allowedKeys.has(buildKey(row.size, row.color)));
    const existingKeys = new Set(existing.map((row) => buildKey(row.size, row.color)));
    const generated = sizeIds.flatMap((size) =>
      stableColorIds.flatMap((color) => {
        const key = buildKey(size, color);
        if (existingKeys.has(key)) return [];
        return [{
          size,
          color,
          sku: `${size.toUpperCase()}-${color.toUpperCase()}-${existing.length + 1}`,
          stock: 0,
          available: false,
        }];
      }),
    );
    setRows([...existing, ...generated]);
    setDirty(generated.length > 0 || existing.length !== live.length);
  }, [live, colorAxisKey, sizeAxisKey, stableColorIds, sizeIds]);

  const presentKeys = React.useMemo(
    () => new Set(rows.map((r) => buildKey(r.size, r.color))),
    [rows],
  );

  const toggle = (size: string, color: string, on: boolean) => {
    if (!stableColorIds.includes(color) || !sizeIds.includes(size)) return;
    setRows((prev) => {
      const key = buildKey(size, color);
      if (on) {
        if (prev.some((r) => buildKey(r.size, r.color) === key)) return prev;
        return [
          ...prev,
          {
            size,
            color,
            sku: `${size.toUpperCase()}-${color.toUpperCase()}-${prev.length + 1}`,
            stock: 0,
            available: true,
          },
        ];
      }
      return prev.filter((r) => buildKey(r.size, r.color) !== key);
    });
    setDirty(true);
  };

  const update = (index: number, patch: Partial<Row>) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
    setDirty(true);
  };

  const reset = () => {
    if (!live) return;
    setRows(
      live.map((v: Doc<"variants">) => ({
        size: v.size,
        color: v.color,
        sku: v.sku,
        stock: v.stock,
        priceCentsOverride: v.priceCentsOverride,
        available: v.available,
      })),
    );
    setDirty(false);
  };

  const handleSave = async () => {
    setBusy(true);
    setSaveError(null);
    try {
      const result = await withAdminTimeout(sync({
        productId,
        rows: rows.map((r) => ({
          size: r.size,
          color: r.color,
          sku: r.sku,
          stock: r.stock,
          priceCentsOverride: r.priceCentsOverride,
          available: r.available,
        })),
      }));
      setLastResult(result);
      setDirty(false);
    } catch (error) {
      setSaveError(getAdminErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-edge bg-white/85 p-5">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="type-eyebrow text-ink-muted">مرحلهٔ ۵ · تنوع‌ها</p>
            <h3 className="mt-2 font-display text-2xl text-ink">
              جدول سایز × رنگ
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reset}
              disabled={!dirty || busy}
              className="inline-flex items-center gap-1.5 rounded-full hairline px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-ink-soft transition hover:bg-white disabled:opacity-40"
            >
              <RotateCcw className="h-3 w-3" /> بازنشانی
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary disabled:opacity-40"
            >
              <Save className="h-3 w-3" /> ذخیرهٔ تنوع‌ها
            </button>
          </div>
        </div>

        <AnimatePresence>
          {lastResult && (
            <motion.div
              key={`r-${lastResult.rows}-${lastResult.softWarned}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE_LUXURY }}
              className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700"
            >
              <Check className="h-3.5 w-3.5" />
              {lastResult.rows.toLocaleString("fa-IR")} تنوع ذخیره شد.
              {lastResult.softWarned > 0
                ? ` ${lastResult.softWarned.toLocaleString("fa-IR")} تنوع دارای موجودی، غیرفعال نگه داشته شد.`
                : ""}
            </motion.div>
          )}
        </AnimatePresence>

        {saveError ? (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
            {saveError}
          </p>
        ) : null}

        {stableColorIds.length === 0 || sizeIds.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-edge bg-canvas-soft px-5 py-8 text-center text-sm text-ink-muted">
            حداقل یک رنگ و یک سایز را در <strong>مرحلهٔ ۱ · اطلاعات پایه</strong> انتخاب کنید تا جدول تنوع‌ها فعال شود.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto rounded-2xl border border-edge bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-canvas-soft text-ink-muted">
                <tr>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.16em]">سایز</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.16em]">رنگ</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.16em]">کد محصول</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.16em]">موجودی</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.16em]">تغییر قیمت</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.16em]">موجود</th>
                  <th className="px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-right">مدیریت</th>
                </tr>
              </thead>
              <tbody>
                {sizeIds.flatMap((size) =>
                  stableColorIds.map((color) => {
                    const key = buildKey(size, color);
                    const on = presentKeys.has(key);
                    const rowIdx = rows.findIndex(
                      (r) => buildKey(r.size, r.color) === key,
                    );
                    const row = rowIdx >= 0 ? rows[rowIdx] : null;
                    return (
                      <tr
                        key={key}
                        className={cn(
                          "border-t border-edge/60",
                          row && !row.available && "bg-rose-50/60",
                        )}
                      >
                        <td className="px-3 py-2 font-medium text-ink">{sizeLabelById.get(size) ?? size}</td>
                        <td className="px-3 py-2 text-ink-soft">{color}</td>
                        <td className="px-3 py-2">
                          {on ? (
                            <input
                              type="text"
                              value={row?.sku ?? ""}
                              onChange={(e) =>
                                rowIdx >= 0 && update(rowIdx, { sku: e.target.value })
                              }
                              className="w-32 rounded-lg hairline bg-canvas-soft px-2 py-1 text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          ) : (
                            <span className="text-ink-muted">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {on ? (
                            <input
                              type="number"
                              min={0}
                              value={row?.stock ?? 0}
                              onChange={(e) =>
                                rowIdx >= 0 &&
                                update(rowIdx, { stock: Number(e.target.value) || 0 })
                              }
                              className="w-20 rounded-lg hairline bg-canvas-soft px-2 py-1 text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          ) : (
                            <span className="text-ink-muted">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {on ? (
                            <input
                              type="number"
                              value={
                                row?.priceCentsOverride === undefined ? "" : row.priceCentsOverride
                              }
                              placeholder="اختیاری"
                              onChange={(e) =>
                                rowIdx >= 0 &&
                                update(rowIdx, {
                                  priceCentsOverride:
                                    e.target.value === "" ? undefined : Number(e.target.value) || 0,
                                })
                              }
                              className="w-24 rounded-lg hairline bg-canvas-soft px-2 py-1 text-[12px] text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          ) : (
                            <span className="text-ink-muted">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {on ? (
                            <button
                              type="button"
                              onClick={() =>
                                rowIdx >= 0 && update(rowIdx, { available: !(row?.available ?? true) })
                              }
                              className={cn(
                                "inline-flex h-6 w-11 items-center rounded-full p-1 transition",
                                row?.available ? "bg-emerald-500" : "bg-zinc-300",
                              )}
                              aria-label={`وضعیت موجودی: ${row?.available ? "فعال" : "غیرفعال"}`}
                            >
                              <span
                                className={cn(
                                  "h-4 w-4 rounded-full bg-white transition-transform",
                                  row?.available && "translate-x-5",
                                )}
                              />
                            </button>
                          ) : (
                            <span className="text-ink-muted">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => toggle(size, color, !on)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.16em]",
                              on
                                ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
                            )}
                          >
                            {on ? (
                              <>
                                <Trash2 className="h-3 w-3" /> حذف
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3" /> افزودن
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          </div>
        )}

        {rows.some((r) => !r.available && r.stock > 0) && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
            <AlertCircle className="h-3.5 w-3.5" />
            بعضی تنوع‌ها هنوز موجودی دارند اما غیرفعال هستند؛ پیش از انتشار وضعیت آن‌ها را بررسی کنید.
          </div>
        )}
      </div>
    </div>
  );
}
