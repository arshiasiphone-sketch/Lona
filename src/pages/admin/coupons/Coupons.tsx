import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Trash2,
  Power,
  Tag,
  Calendar,
  Hash,
  Percent,
  Loader2,
  Pencil,
  ShieldOff,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { glass } from "@/lib/glass";
import { AdminEmptyState } from "@/components/admin";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/lib/toast";

type Coupon = Doc<"coupons">;

const STATUS_LABEL = {
  active: "فعال",
  inactive: "غیرفعال",
} as const;

export default function CouponsAdmin() {
  const coupons = useQuery(api.admin_catalog.listCoupons, {});
  const upsert = useMutation(api.admin_catalog.upsertCoupon);
  const archive = useMutation(api.admin_catalog.archiveCoupon);
  const enable = useMutation(api.admin_catalog.enableCoupon);
  const remove = useMutation(api.admin_catalog.deleteCoupon);
  const toast = useToast();

  const [needle, setNeedle] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editor, setEditor] = useState<{ open: boolean; row: Coupon | null }>({
    open: false,
    row: null,
  });
  const [confirm, setConfirm] = useState<{
    open: boolean;
    row: Coupon | null;
    action: "delete" | "archive" | "enable";
  }>({ open: false, row: null, action: "delete" });

  const rows = useMemo(() => {
    const list = coupons ?? [];
    return list.filter((row) => {
      if (!showArchived && row.active === false) return false;
      if (!needle) return true;
      const hay = [row.code, row.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle.toLowerCase());
    });
  }, [coupons, needle, showArchived]);

  function openCreate() {
    setEditor({ open: true, row: null });
  }
  function openEdit(row: Coupon) {
    setEditor({ open: true, row });
  }

  function runConfirm() {
    if (!confirm.row) return;
    const { row, action } = confirm;
    setConfirm({ ...confirm, open: false });
    const id = row._id as Id<"coupons">;
    if (action === "delete") {
      Promise.resolve(remove({ id }))
        .then(() => toast.success("کوپن حذف شد"))
        .catch((err: unknown) => toast.error(`خطا: ${(err as Error)?.message ?? "نامشخص"}`));
    } else if (action === "archive") {
      Promise.resolve(archive({ id }))
        .then(() => toast.success("کوپن غیرفعال شد"))
        .catch((err: unknown) => toast.error(`خطا: ${(err as Error)?.message ?? "نامشخص"}`));
    } else {
      Promise.resolve(enable({ id }))
        .then(() => toast.success("کوپن فعال شد"))
        .catch((err: unknown) => toast.error(`خطا: ${(err as Error)?.message ?? "نامشخص"}`));
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">کوپن‌های تخفیف</h1>
        <p className="text-sm text-neutral-500">ساخت و مدیریت کدهای تخفیف فروشگاه</p>
      </header>

      <div className={`flex flex-wrap items-center gap-3 p-4 ${glass.surface} rounded-2xl`}>
        <div className="relative flex-1 min-w-[220px]">
          <Hash className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            value={needle}
            onChange={(e) => setNeedle(e.target.value)}
            placeholder="جستجوی کد یا توضیحات…"
            className="w-full rounded-xl border border-white/40 bg-white/60 pe-9 ps-3 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-neutral-700">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-neutral-300"
          />
          نمایش غیرفعال‌ها
        </label>
        <button
          onClick={openCreate}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" />
          ایجاد کوپن
        </button>
      </div>

      {!coupons ? (
        <SkeletonList />
      ) : rows.length === 0 ? (
        <AdminEmptyState
          icon={<Tag className="h-6 w-6" />}
          title="کوپنی وجود ندارد"
          body={needle ? "کوپنی با این جستجو یافت نشد." : "برای شروع، یک کوپن تخفیف ایجاد کنید."}
          action={
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
            >
              ایجاد اولین کوپن
            </button>
          }
        />
      ) : (
        <div className={`overflow-hidden rounded-2xl ${glass.surface}`}>
          <table className="w-full text-sm">
            <thead className="bg-white/50 text-neutral-500">
              <tr className="text-right">
                <th className="px-4 py-3 font-medium">کد</th>
                <th className="px-4 py-3 font-medium">مقدار</th>
                <th className="px-4 py-3 font-medium">استفاده</th>
                <th className="px-4 py-3 font-medium">انقضا</th>
                <th className="px-4 py-3 font-medium">وضعیت</th>
                <th className="px-4 py-3 font-medium text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/60">
              {rows.map((row) => (
                <tr key={row._id} className="hover:bg-white/40">
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm text-neutral-900">{row.code}</div>
                    {row.description && (
                      <div className="text-xs text-neutral-500">{row.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-neutral-900">
                      <Percent className="h-3.5 w-3.5" />
                      {Math.round((row.percentOff ?? 0) * 100)}٪
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {row.usedCount}
                    {row.maxUses ? ` / ${row.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {row.validUntil ? toFaDate(row.validUntil) : "بدون انقضا"}
                  </td>
                  <td className="px-4 py-3">
                    {row.active !== false ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                        {STATUS_LABEL.active}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
                        {STATUS_LABEL.inactive}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/40 bg-white/60 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        ویرایش
                      </button>
                      <button
                        onClick={() =>
                          setConfirm({
                            open: true,
                            row,
                            action: row.active === false ? "enable" : "archive",
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-white/40 bg-white/60 px-2.5 py-1.5 text-xs text-neutral-700 hover:bg-white"
                      >
                        {row.active === false ? (
                          <>
                            <Power className="h-3.5 w-3.5" /> فعال‌سازی
                          </>
                        ) : (
                          <>
                            <ShieldOff className="h-3.5 w-3.5" /> غیرفعال‌سازی
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setConfirm({ open: true, row, action: "delete" })}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {editor.open && (
          <CouponEditor
            initial={editor.row}
            onClose={() => setEditor({ open: false, row: null })}
            onSave={async (payload) => {
              setEditor({ open: false, row: null });
              try {
                await upsert(payload);
                toast.success(editor.row ? "کوپن ویرایش شد" : "کوپن ایجاد شد");
              } catch (err) {
                toast.error(`خطا: ${(err as Error)?.message ?? "نامشخص"}`);
              }
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(o) => !o && setConfirm({ ...confirm, open: false })}
        title={
          confirm.action === "delete"
            ? "حذف کوپن"
            : confirm.action === "archive"
              ? "غیرفعال‌سازی کوپن"
              : "فعال‌سازی کوپن"
        }
        body={
          confirm.action === "delete"
            ? `آیا از حذف کوپن «${confirm.row?.code ?? ""}» مطمئن هستید؟ این عملیات قابل بازگشت نیست.`
            : confirm.action === "archive"
              ? `کوپن «${confirm.row?.code ?? ""}» غیرفعال می‌شود.`
              : `کوپن «${confirm.row?.code ?? ""}» دوباره فعال می‌شود.`
        }
        tone={confirm.action === "delete" ? "destructive" : "info"}
        confirmLabel={confirm.action === "delete" ? "حذف نهایی" : "تأیید"}
        onConfirm={runConfirm}
      />
    </div>
  );
}

function toFaDate(ts: number) {
  try {
    return new Date(ts).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function SkeletonList() {
  return (
    <div className={`overflow-hidden rounded-2xl ${glass.surface}`}>
      <div className="space-y-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 rounded-lg bg-neutral-200/40 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function CouponEditor({
  initial,
  onClose,
  onSave,
}: {
  initial: Coupon | null;
  onClose: () => void;
  onSave: (payload: {
    code: string;
    percentOff: number;
    description?: string;
    active: boolean;
    validUntil?: number;
    maxUses?: number;
  }) => void;
}) {
  const [code, setCode] = useState(initial?.code ?? "");
  const [percent, setPercent] = useState(
    initial ? Math.round((initial.percentOff ?? 0) * 100) : 10,
  );
  const [usageLimit, setUsageLimit] = useState(initial?.maxUses ?? 0);
  const [enabled, setEnabled] = useState(initial?.active !== false);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [expiresAt, setExpiresAt] = useState<string>(
    initial?.validUntil ? new Date(initial.validUntil).toISOString().slice(0, 10) : "",
  );
  const [busy, setBusy] = useState(false);

  function save() {
    if (busy) return;
    if (!code.trim()) return;
    const pct = Math.min(100, Math.max(1, percent));
    setBusy(true);
    // Real schema: percentOff is a 0–1 fraction, active, validUntil,
    // maxUses. (No fixed-amount / min-subtotal fields exist.)
    onSave({
      code: code.trim().toUpperCase(),
      percentOff: pct / 100,
      description: description.trim() || undefined,
      active: enabled,
      validUntil: expiresAt ? new Date(expiresAt).getTime() : undefined,
      maxUses: usageLimit > 0 ? Math.round(usageLimit) : undefined,
    });
    setBusy(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-neutral-900/30 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg overflow-hidden rounded-2xl ${glass.modal}`}
        dir="rtl"
      >
        <div className="flex items-center justify-between border-b border-white/40 px-5 py-4">
          <h3 className="text-base font-semibold text-neutral-900">
            {initial ? "ویرایش کوپن" : "ایجاد کوپن"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-white/60"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <Field label="کد کوپن">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="مثلاً LONA20"
              dir="ltr"
              className="w-full rounded-xl border border-white/40 bg-white/70 px-3 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            />
          </Field>

          <Field label="درصد تخفیف">
            <input
              type="number"
              min={1}
              max={100}
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-white/40 bg-white/70 px-3 py-2.5 text-sm"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="سقف استفاده">
              <input
                type="number"
                min={0}
                value={usageLimit}
                onChange={(e) => setUsageLimit(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-white/40 bg-white/70 px-3 py-2.5 text-sm"
              />
            </Field>
            <Field label="تاریخ انقضا">
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded-xl border border-white/40 bg-white/70 px-3 py-2.5 pe-9 text-sm"
                />
              </div>
            </Field>
          </div>

          <Field label="توضیحات">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-white/40 bg-white/70 px-3 py-2.5 text-sm"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded border-neutral-300"
            />
            کوپن فعال باشد
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/40 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/40 bg-white/60 px-4 py-2 text-sm text-neutral-700 hover:bg-white"
          >
            انصراف
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {initial ? "ذخیره تغییرات" : "ایجاد کوپن"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  );
}
