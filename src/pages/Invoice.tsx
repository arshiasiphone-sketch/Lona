/**
 * Phase 8.2 — invoice.
 *
 * /invoice/:number — a print-ready invoice for a paid order:
 * store identity + customer snapshot + line items with SKU + totals
 * + payment reference. Uses `window.print()` for PDF export; the
 * print stylesheet in index.css hides chrome and renders a clean A4.
 */
import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LonaLogo } from "@/components/brand/LonaLogo";
import { EASE_LUXURY } from "@/lib/motion";
import { formatPrice, formatDate, formatNumber } from "@/lib/money";
import { OrderTimeline } from "@/components/order/OrderTimeline";

const PAYMENT_LABEL: Record<string, string> = {
  pending: "در انتظار پرداخت",
  initiated: "در حال پرداخت",
  redirected: "انتقال به درگاه",
  paid: "پرداخت شده",
  failed: "ناموفق",
  cancelled: "لغو شده",
  refunded: "بازگشت وجه",
};

export default function Invoice() {
  const { number = "" } = useParams();
  const data = useQuery(api.orders.getByNumber, number ? { number } : "skip");
  const store = useQuery(api.admin_settings.getStoreInfo, {});

  if (!data) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const { items } = data;
  const order = data;
  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-6 pt-32 pb-24 text-center">
        <p className="type-eyebrow text-ink-muted">صورتحساب</p>
        <h1 className="mt-3 font-display text-4xl text-ink">
          سفارش یافت نشد.
        </h1>
        <Link
          to="/dashboard"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          بازگشت به حساب
        </Link>
      </div>
    );
  }

  const shopName = store?.shopName || "لونا";
  const paymentStatus = String(order.paymentStatus ?? "pending");

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:py-20">
      {/* Chrome (hidden when printing) */}
      <div className="no-print mb-10 flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-full hairline px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft transition hover:bg-white/60 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          حساب من
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary"
        >
          <Printer className="h-3.5 w-3.5" />
          چاپ / PDF
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_LUXURY }}
        className="invoice-sheet"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-6 border-b border-edge pb-8">
          <div className="flex items-center gap-3">
            <LonaLogo variant="default" size={40} />
            <div>
              <p className="type-eyebrow text-ink-muted">{shopName}</p>
            </div>
          </div>
          <div className="text-left">
            <p className="type-eyebrow text-ink-muted">صورتحساب</p>
            <p className="mt-1 font-mono text-sm text-ink" dir="ltr">
              {order.number}
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              {formatDate(order.placedAt)}
            </p>
          </div>
        </div>

        {/* Store + customer */}
        <div className="grid gap-6 pt-8 text-sm sm:grid-cols-2">
          <div>
            <p className="type-eyebrow text-ink-muted">فروشگاه</p>
            <div className="mt-2 space-y-1 text-ink-soft">
              {store?.legalName && <p className="text-ink">{store.legalName}</p>}
              {store?.address && <p>{store.address}</p>}
              {(store?.landlinePhone || store?.mobilePhone || store?.phone) && (
                <p dir="ltr" className="text-left">
                  {store.landlinePhone || store.phone || store.mobilePhone}
                </p>
              )}
              {store?.mobilePhone && store.mobilePhone !== (store.landlinePhone || store.phone) && (
                <p dir="ltr" className="text-left">همراه: {store.mobilePhone}</p>
              )}
              {store?.email && <p dir="ltr" className="text-left">{store.email}</p>}
              {store?.postalCode && <p>کد پستی: {store.postalCode}</p>}
              {store?.nationalId && <p>شناسه ملی: {store.nationalId}</p>}
              {store?.registrationNumber && <p>شماره ثبت: {store.registrationNumber}</p>}
              {store?.economicCode && <p>کد اقتصادی: {store.economicCode}</p>}
            </div>
          </div>
          <div>
            <p className="type-eyebrow text-ink-muted">گیرنده</p>
            <div className="mt-2 space-y-1 text-ink-soft">
              <p className="text-ink">{order.shipping.fullName}</p>
              <p>{order.shipping.line1}</p>
              <p>
                {order.shipping.city} · {order.shipping.region}
              </p>
              <p>کد پستی: {order.shipping.postalCode}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <table className="mt-10 w-full text-sm">
          <thead>
            <tr className="border-b border-edge text-right type-eyebrow text-ink-muted">
              <th className="pb-3 font-medium">کالا</th>
              <th className="pb-3 font-medium">SKU</th>
              <th className="pb-3 font-medium">تعداد</th>
              <th className="pb-3 text-left font-medium">قیمت واحد</th>
              <th className="pb-3 text-left font-medium">جمع</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((item, i) => (
              <tr key={String(item._id ?? i)} className="border-b border-edge/60">
                <td className="py-3">
                  <p className="text-ink">{item.productNameSnapshot}</p>
                  <p className="text-xs text-ink-muted">
                    {item.color} · {item.size}
                  </p>
                </td>
                <td className="py-3 font-mono text-xs text-ink-soft" dir="ltr">
                  {item.skuSnapshot ?? "—"}
                </td>
                <td className="py-3 text-ink">
                  {formatNumber(item.quantity)}
                </td>
                <td className="py-3 text-left text-ink">
                  {formatPrice(item.unitPriceCents)}
                </td>
                <td className="py-3 text-left font-medium text-ink">
                  {formatPrice(item.lineTotalCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-ink-soft">
              <dt>جمع جزء</dt>
              <dd>{formatPrice(order.subtotalCents)}</dd>
            </div>
            {order.discountCents > 0 && (
              <div className="flex justify-between text-primary">
                <dt>تخفیف</dt>
                <dd>−{formatPrice(order.discountCents)}</dd>
              </div>
            )}
            <div className="flex justify-between text-ink-soft">
              <dt>ارسال {order.shippingMethodName ? `(${order.shippingMethodName})` : ""}</dt>
              <dd>{formatPrice(order.shippingCents)}</dd>
            </div>
            <div className="flex justify-between border-t border-edge pt-3 font-display text-lg text-ink">
              <dt>مبلغ قابل پرداخت</dt>
              <dd>{formatPrice(order.totalCents)}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-10">
          <h3 className="font-display text-lg text-ink mb-4">مسیر سفارش</h3>
          <OrderTimeline status={order.status} history={order.history as never} />
        </div>
        {/* Payment + footer */}
        <div className="mt-10 border-t border-edge pt-6 text-xs text-ink-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>
              وضعیت پرداخت:{" "}
              <span className="font-medium text-ink">
                {PAYMENT_LABEL[paymentStatus] ?? paymentStatus}
              </span>
            </p>
            {order.paymentReference && (
              <p dir="ltr" className="font-mono">
                {order.paymentReference}
              </p>
            )}
            {order.paymentTransactionId && (
              <p dir="ltr" className="font-mono">
                تراکنش: {order.paymentTransactionId}
              </p>
            )}
          </div>
          <p className="mt-4 leading-relaxed">
            {shopName} — بسته‌بندی محرمانه و ظریف، مطابق استاندارد لونا. در صورت
            نیاز به بازگشت کالا، به صفحه شرایط بازگشت مراجعه کنید.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
