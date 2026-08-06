import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function ActivityTimelinePage() {
  const rows = useQuery(api.admin_orders.listActivity, { limit: 100 });
  const [filter, setFilter] = useState("");
  if (!rows) return <div className="grid place-items-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  const filtered = filter ? rows.filter((r) => r.action.includes(filter) || r.resource.includes(filter)) : rows;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="font-display text-3xl text-ink">تایم‌لاین فعالیت‌ها</h1><p className="text-sm text-ink-muted mt-1">تمام تغییرات ثبت‌شده</p></div>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="فیلتر: order, product…" className="rounded-2xl border border-edge bg-white px-4 py-2 text-sm" dir="ltr" />
      </header>
      <ol className="space-y-2">
        {filtered.map((r) => (
          <li key={r._id} className="rounded-2xl border border-edge bg-white px-4 py-3 flex gap-3">
            <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm text-ink">{r.action} — {r.resource} {r.resourceId ? `(${String(r.resourceId).slice(0, 8)})` : ""}</p>
              <p className="text-xs text-ink-muted">{new Date(r.at).toLocaleString("fa-IR")} {r.userId ? `· ${String(r.userId).slice(0, 6)}` : ""}</p>
            </div>
          </li>
        ))}
        {filtered.length === 0 && <p className="text-sm text-ink-muted text-center py-8">موردی یافت نشد.</p>}
      </ol>
    </div>
  );
}
