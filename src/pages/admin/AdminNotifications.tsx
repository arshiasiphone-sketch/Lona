import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell } from "lucide-react";

export default function AdminNotificationsPage() {
  const orders = useQuery(api.admin_orders.listAllOrders, { limit: 6 });
  const tickets = useQuery(api.support.listAllTickets, {});
  const rets = useQuery(api.returns.listAllReturns, {});
  const low = useQuery(api.reports.overview, {});

  const items: Array<{ title: string; body: string }> = [];
  if (orders?.length) items.push({ title: "سفارش جدید", body: `${orders.length} سفارش اخیر — ${orders[0].number}` });
  if (tickets?.some((t) => t.status === "new")) items.push({ title: "تیکت جدید", body: `${tickets.filter((t) => t.status === "new").length.toLocaleString("fa-IR")} تیکت جدید` });
  if (rets?.some((r) => r.status === "submitted")) items.push({ title: "مرجوعی جدید", body: `${rets.filter((r) => r.status === "submitted").length.toLocaleString("fa-IR")} درخواست در انتظار` });
  if (low?.lowStock?.length) items.push({ title: "موجودی کم", body: `${low.lowStock.length.toLocaleString("fa-IR")} واریانت کم‌موجود` });

  return (
    <div className="space-y-6">
      <header><h1 className="font-display text-3xl text-ink">اعلان‌های ادمین</h1><p className="text-sm text-ink-muted mt-1">رویدادهای مهم — realtime از Convex</p></header>
      {items.length === 0 ? <p className="rounded-3xl border border-dashed border-edge bg-white/60 px-6 py-12 text-center text-sm text-ink-muted">اعلان جدیدی نیست.</p> : (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={i} className="rounded-2xl border border-edge bg-white px-4 py-4 flex gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary shrink-0"><Bell className="h-4 w-4" /></span>
              <div><p className="text-sm font-medium text-ink">{it.title}</p><p className="text-xs text-ink-muted mt-0.5">{it.body}</p></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
