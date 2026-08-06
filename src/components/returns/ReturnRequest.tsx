import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export function ReturnRequest({ orderId }: { orderId: Id<"orders"> }) {
  const my = useQuery(api.returns.listMyReturns, {});
  const create = useMutation(api.returns.requestReturn);
  const [type, setType] = useState<"return" | "exchange">("return");
  const [reason, setReason] = useState("");
  const [desc, setDesc] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr(""); setMsg("");
    try {
      await create({ orderId, type, reason, description: desc || undefined });
      setMsg("درخواست ثبت شد");
      setReason(""); setDesc("");
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "خطا"); }
  };

  const orderReturns = my?.filter((r) => r.orderId === orderId) ?? [];

  return (
    <div className="glass rounded-3xl p-6 space-y-4">
      <h3 className="font-display text-lg text-ink">درخواست مرجوعی / تعویض</h3>
      <div className="flex gap-2">
        <button onClick={() => setType("return")} className={`rounded-full px-4 py-2 text-sm border ${type === "return" ? "bg-ink text-canvas border-ink" : "bg-white border-edge"}`}>مرجوعی</button>
        <button onClick={() => setType("exchange")} className={`rounded-full px-4 py-2 text-sm border ${type === "exchange" ? "bg-ink text-canvas border-ink" : "bg-white border-edge"}`}>تعویض</button>
      </div>
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="دلیل" className="w-full rounded-2xl border border-edge bg-white px-4 py-2.5 text-sm" />
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="توضیح اختیاری" rows={2} className="w-full rounded-2xl border border-edge bg-white px-4 py-2.5 text-sm" />
      {err && <p className="text-xs text-destructive">{err}</p>}
      {msg && <p className="text-xs text-emerald-600">{msg}</p>}
      <button onClick={submit} className="rounded-full bg-ink px-6 py-2.5 text-sm text-canvas hover:bg-primary">ثبت درخواست</button>
      {my === undefined ? <Loader2 className="h-4 w-4 animate-spin" /> : orderReturns.length > 0 && (
        <ul className="space-y-2 pt-2">
          {orderReturns.map((r) => (
            <li key={r._id} className="rounded-2xl border border-edge bg-white px-4 py-2 text-sm flex justify-between">
              <span>{r.type === "return" ? "مرجوعی" : "تعویض"} · {r.reason}</span>
              <span className="text-ink-muted text-xs">{r.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
