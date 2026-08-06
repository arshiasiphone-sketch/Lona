import { Check, Package, Truck, Home, CreditCard, Clock } from "lucide-react";
import { cn } from "@/lib/glass";

const STEPS = [
  { key: "pending", label: "ثبت سفارش", icon: Clock },
  { key: "processing", label: "پرداخت", icon: CreditCard },
  { key: "processing2", label: "آماده‌سازی", icon: Package },
  { key: "shipped", label: "تحویل به پست", icon: Truck },
  { key: "transit", label: "در مسیر", icon: Truck },
  { key: "delivered", label: "تحویل شده", icon: Home },
] as const;

function statusToIndex(status: string) {
  const map: Record<string, number> = { pending: 0, processing: 1, shipped: 3, delivered: 5, cancelled: -1, returning: 3 };
  return map[status] ?? 0;
}

export function OrderTimeline({ status, history }: { status: string; history?: Array<{ status: string; at: number; note?: string }> }) {
  const activeIdx = statusToIndex(status);
  const isCancelled = status === "cancelled";
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
        {STEPS.map((step, i) => {
          const done = !isCancelled && i <= activeIdx;
          const current = i === activeIdx && !isCancelled;
          const Icon = step.icon;
          return (
            <div key={step.key + String(i)} className="flex flex-1 flex-col items-center gap-2">
              <div className={cn("grid h-9 w-9 place-items-center rounded-full border text-sm", done ? "bg-ink text-canvas border-ink" : "bg-white border-edge text-ink-muted", current && "ring-2 ring-primary ring-offset-2")}>
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={cn("text-[11px] text-center", done ? "text-ink font-medium" : "text-ink-muted")}>{step.label}</span>
              {i < STEPS.length - 1 && <div className={cn("mt-1 h-0.5 w-full hidden sm:block", i < activeIdx ? "bg-ink" : "bg-edge")} />}
            </div>
          );
        })}
      </div>
      {isCancelled && <p className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-ink-soft text-center">سفارش لغو شده است.</p>}
      {history && history.length > 0 && (
        <ol className="space-y-3">
          {history.map((h) => (
            <li key={String(h.at) + h.status} className="flex gap-3 rounded-2xl border border-edge bg-white/70 px-4 py-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-ink">{h.status} {h.note ? `— ${h.note}` : ""}</p>
                <p className="text-xs text-ink-muted">{new Date(h.at).toLocaleString("fa-IR")}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
