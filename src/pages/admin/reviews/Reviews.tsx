import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Star,
  Check,
  EyeOff,
  Trash2,
  Filter,
  Loader2,
  User,
  Calendar,
  X,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { glass } from "@/lib/glass";
import { AdminEmptyState } from "@/components/admin";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/lib/toast";

type ReviewStatus = "pending" | "published" | "rejected";
type Review = {
  _id: string;
  _creationTime?: number;
  rating?: number;
  title?: string;
  body?: string;
  authorName?: string;
  customerName?: string;
  status?: ReviewStatus | string;
  productId?: string;
  productTitle?: string;
  createdAt?: number;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "در انتظار تأیید",
  published: "منتشر شده",
  rejected: "مخفی",
};

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  pending: "warning",
  published: "success",
  rejected: "danger",
};

export default function ReviewsAdmin() {
  const reviews = useQuery(api.admin_orders.listReviewsForAdmin, {});
  const approve = useMutation(api.admin_reviews.approveReview);
  const hide = useMutation(api.admin_reviews.hideReview);
  const remove = useMutation(api.admin_reviews.deleteReview);
  const toast = useToast();

  const [needle, setNeedle] = useState("");
  const [status, setStatus] = useState<ReviewStatus | "all">("all");
  const [confirm, setConfirm] = useState<{
    open: boolean;
    row: Review | null;
    action: "approve" | "hide" | "delete" | null;
  }>({ open: false, row: null, action: null });

  const rows = useMemo(() => {
    const list = (reviews ?? []) as Review[];
    return list.filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      if (!needle) return true;
      const hay = [row.title, row.body, row.authorName, row.customerName, row.productTitle]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle.toLowerCase());
    });
  }, [reviews, needle, status]);

  function run() {
    const { row, action } = confirm;
    if (!row || !action) return;
    const id = row._id as any;
    setConfirm({ open: false, row: null, action: null });
    const op =
      action === "approve"
        ? approve({ id })
        : action === "hide"
          ? hide({ id })
          : remove({ id });
    Promise.resolve(op)
      .then(() =>
        toast.success(
          action === "approve"
            ? "نظر تأیید و منتشر شد"
            : action === "hide"
              ? "نظر مخفی شد"
              : "نظر حذف شد",
        ),
      )
      .catch((err: unknown) => toast.error(`خطا: ${(err as Error)?.message ?? "نامشخص"}`));
  }

  return (
    <div className="space-y-6" dir="rtl">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">مدیریت نظرات</h1>
        <p className="text-sm text-neutral-500">تأیید، مخفی‌سازی یا حذف نظرات مشتریان</p>
      </header>

      <div className={`flex flex-wrap items-center gap-3 p-4 ${glass.surface} rounded-2xl`}>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            value={needle}
            onChange={(e) => setNeedle(e.target.value)}
            placeholder="جستجو در متن نظر، نام نویسنده یا محصول…"
            className="w-full rounded-xl border border-white/40 bg-white/60 pe-9 ps-3 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-700">
          <Filter className="h-4 w-4 text-neutral-400" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ReviewStatus | "all")}
            className="rounded-xl border border-white/40 bg-white/60 px-3 py-2.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="pending">{STATUS_LABEL.pending}</option>
            <option value="published">{STATUS_LABEL.published}</option>
            <option value="rejected">{STATUS_LABEL.rejected}</option>
          </select>
        </div>
      </div>

      {!reviews ? (
        <SkeletonList />
      ) : rows.length === 0 ? (
        <AdminEmptyState
          icon={<Star className="h-6 w-6" />}
          title="نظری یافت نشد"
          body={needle || status !== "all" ? "با فیلتر فعلی نظری پیدا نشد." : "هنوز نظری ثبت نشده است."}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {rows.map((row) => {
            const tone = STATUS_TONE[String(row.status ?? "pending")] ?? "neutral";
            const statusLabel = STATUS_LABEL[String(row.status ?? "pending")] ?? "—";
            const created = Number(row._creationTime ?? row.createdAt ?? 0);
            return (
              <article
                key={row._id}
                className={`space-y-3 rounded-2xl p-5 ${glass.surface}`}
              >
                <header className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Stars rating={Number(row.rating ?? 5)} />
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          tone === "success"
                            ? "bg-emerald-50 text-emerald-700"
                            : tone === "warning"
                              ? "bg-amber-50 text-amber-700"
                              : tone === "danger"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    {row.title && (
                      <h3 className="mt-2 text-sm font-semibold text-neutral-900">{row.title}</h3>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    {created ? toFaDate(created) : "—"}
                  </span>
                </header>

                <p className="text-sm leading-7 text-neutral-700 line-clamp-3">
                  {row.body ?? "بدون متن"}
                </p>

                <footer className="flex items-center justify-between border-t border-white/50 pt-3 text-xs">
                  <div className="flex flex-col gap-0.5 text-neutral-500">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      {row.authorName ?? row.customerName ?? "مهمان"}
                    </span>
                    {row.productTitle && (
                      <span className="flex items-center gap-1.5">
                        محصول: {row.productTitle}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {String(row.status ?? "pending") !== "published" && (
                      <IconButton
                        onClick={() => setConfirm({ open: true, row, action: "approve" })}
                        className="text-emerald-700"
                      >
                        <Check className="h-3.5 w-3.5" /> تأیید
                      </IconButton>
                    )}
                    {String(row.status ?? "pending") !== "rejected" && (
                      <IconButton
                        onClick={() => setConfirm({ open: true, row, action: "hide" })}
                        className="text-neutral-700"
                      >
                        <EyeOff className="h-3.5 w-3.5" /> مخفی
                      </IconButton>
                    )}
                    <IconButton
                      onClick={() => setConfirm({ open: true, row, action: "delete" })}
                      className="text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> حذف
                    </IconButton>
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(o) => !o && setConfirm({ open: false, row: null, action: null })}
        title={
          confirm.action === "approve"
            ? "تأیید نظر"
            : confirm.action === "hide"
              ? "مخفی‌سازی نظر"
              : "حذف نظر"
        }
        body={
          confirm.action === "approve"
            ? "این نظر در سایت نمایش داده خواهد شد."
            : confirm.action === "hide"
              ? "این نظر از نمایش عمومی مخفی می‌شود."
              : "این عملیات قابل بازگشت نیست."
        }
        tone={confirm.action === "delete" ? "destructive" : "info"}
        confirmLabel={
          confirm.action === "approve"
            ? "تأیید و انتشار"
            : confirm.action === "hide"
              ? "مخفی‌سازی"
              : "حذف نهایی"
        }
        onConfirm={run}
      />
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-current" : "opacity-30"}`}
        />
      ))}
    </span>
  );
}

function IconButton({
  onClick,
  children,
  className = "",
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg border border-white/40 bg-white/60 px-2 py-1 text-[11px] hover:bg-white ${className}`}
    >
      {children}
    </button>
  );
}

function toFaDate(ts: number) {
  try {
    return new Date(ts).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "—";
  }
}

function SkeletonList() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`h-32 rounded-2xl ${glass.surface} animate-pulse`} />
      ))}
    </div>
  );
}
