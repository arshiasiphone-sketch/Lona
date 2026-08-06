import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#8b5a3c", "#c49a6c", "#e8d5b7", "#a67c52", "#6b3a2a", "#d4b896"];

export default function ReportsPage() {
  const data = useQuery(api.reports.overview, {});
  if (!data) return <div className="grid place-items-center py-16"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const k = data.kpi;
  const fmt = (c: number) => (c / 100).toLocaleString("fa-IR") + " تومان";

  return (
    <div className="space-y-8">
      <header><h1 className="font-display text-3xl text-ink">گزارش‌ها</h1><p className="text-sm text-ink-muted mt-1">نمای کلی فروش و عملکرد</p></header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: "فروش امروز", v: fmt(k.todaySalesCents) },
          { l: "فروش هفته", v: fmt(k.weekSalesCents) },
          { l: "فروش ماه", v: fmt(k.monthSalesCents) },
          { l: "میانگین سفارش", v: fmt(k.avgOrderValueCents) },
          { l: "سفارش امروز", v: k.todayOrderCount.toLocaleString("fa-IR") },
          { l: "سفارش ماه", v: k.monthOrderCount.toLocaleString("fa-IR") },
          { l: "مشتری جدید (ماه)", v: k.newCustomersMonth.toLocaleString("fa-IR") },
          { l: "نرخ بازگشت", v: String(k.returningRate) },
        ].map((x) => (
          <div key={x.l} className="rounded-3xl border border-edge bg-white p-5">
            <p className="type-eyebrow text-ink-muted">{x.l}</p>
            <p className="mt-2 font-display text-2xl text-ink">{x.v}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-edge bg-white p-6">
        <h3 className="font-display text-lg text-ink">فروش ۱۴ روز اخیر</h3>
        <div className="mt-4 h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.salesByDay}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmt(v as number)} />
              <Line type="monotone" dataKey="cents" stroke="#8b5a3c" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-edge bg-white p-6">
          <h3 className="font-display text-lg text-ink">سهم دسته‌ها</h3>
          <div className="h-64 mt-4" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.categoryShare} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {data.categoryShare.map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-3xl border border-edge bg-white p-6">
          <h3 className="font-display text-lg text-ink">پرفروش‌ترین محصولات</h3>
          <div className="h-64 mt-4" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topProducts}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="qty" fill="#8b5a3c" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-edge bg-white p-6">
        <h3 className="font-display text-lg text-ink">کم‌موجودترین کالاها</h3>
        <ul className="mt-4 space-y-2">
          {data.lowStock.map((r: { sku: string; stock: number; productName: string }) => (
            <li key={r.sku} className="flex justify-between rounded-2xl bg-canvas-soft px-4 py-2 text-sm">
              <span className="text-ink">{r.productName} — {r.sku}</span>
              <span className="text-destructive font-medium">{r.stock.toLocaleString("fa-IR")}</span>
            </li>
          ))}
          {data.lowStock.length === 0 && <p className="text-sm text-ink-muted text-center py-4">موجودی‌ها پایدار هستند.</p>}
        </ul>
      </div>
    </div>
  );
}
