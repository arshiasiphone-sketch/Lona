import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, MessageCircle, Send } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

const CATS = [
  { v: "order", l: "سفارش" },
  { v: "payment", l: "پرداخت" },
  { v: "shipping", l: "ارسال" },
  { v: "product", l: "محصول" },
  { v: "other", l: "سایر" },
] as const;
const PRIS = [
  { v: "low", l: "کم" },
  { v: "medium", l: "متوسط" },
  { v: "high", l: "زیاد" },
  { v: "urgent", l: "فوری" },
] as const;

export function SupportTickets() {
  const tickets = useQuery(api.support.listMyTickets, {});
  const create = useMutation(api.support.createTicket);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [cat, setCat] = useState("other");
  const [pri, setPri] = useState("medium");
  const [selected, setSelected] = useState<Id<"support_tickets"> | null>(null);
  const detail = useQuery(api.support.getTicketWithMessages, selected ? { ticketId: selected } : "skip");
  const reply = useMutation(api.support.replyTicket);
  const [replyBody, setReplyBody] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const submit = async () => {
    setErr(""); setOk("");
    try {
      await create({ subject, category: cat as never, priority: pri as never, body });
      setSubject(""); setBody(""); setOk("تیکت ثبت شد");
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "خطا"); }
  };
  const sendReply = async () => {
    if (!selected) return;
    try { await reply({ ticketId: selected, body: replyBody }); setReplyBody(""); } catch (e: unknown) { setErr(e instanceof Error ? e.message : "خطا"); }
  };

  if (tickets === undefined) return <div className="grid place-items-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div className="glass rounded-3xl p-6 md:p-8">
        <h3 className="font-display text-xl text-ink">ثبت تیکت جدید</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="موضوع" className="rounded-2xl border border-edge bg-white px-4 py-2.5 text-sm" />
          <div className="flex gap-2">
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="flex-1 rounded-2xl border border-edge bg-white px-3 py-2.5 text-sm">{CATS.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}</select>
            <select value={pri} onChange={(e) => setPri(e.target.value)} className="flex-1 rounded-2xl border border-edge bg-white px-3 py-2.5 text-sm">{PRIS.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}</select>
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="شرح درخواست…" rows={3} className="md:col-span-2 rounded-2xl border border-edge bg-white px-4 py-2.5 text-sm" />
        </div>
        {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
        {ok && <p className="mt-2 text-xs text-emerald-600">{ok}</p>}
        <button onClick={submit} className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-sm text-canvas hover:bg-primary"><Send className="h-4 w-4" /> ارسال</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-2">
          <p className="type-eyebrow text-ink-muted">تیکت‌های من</p>
          {tickets.length === 0 ? <p className="rounded-2xl border border-dashed border-edge bg-white/60 px-4 py-8 text-center text-sm text-ink-muted">هنوز تیکتی ثبت نشده.</p> : tickets.map((t) => (
            <button key={t._id} onClick={() => setSelected(t._id)} className={`w-full text-right rounded-2xl border px-4 py-3 text-sm ${selected === t._id ? "bg-ink text-canvas border-ink" : "bg-white border-edge text-ink"}`}>
              <p className="font-medium truncate">{t.subject}</p>
              <p className={`text-xs mt-1 ${selected === t._id ? "text-canvas/70" : "text-ink-muted"}`}>{t.status} · {new Date(t.updatedAt).toLocaleDateString("fa-IR")}</p>
            </button>
          ))}
        </div>
        <div className="glass rounded-3xl p-6 min-h-[300px]">
          {!selected ? <p className="text-sm text-ink-muted flex items-center gap-2"><MessageCircle className="h-4 w-4" /> تیکتی را انتخاب کنید.</p> : !detail ? <Loader2 className="h-5 w-5 animate-spin" /> : (
            <div className="space-y-4">
              <h4 className="font-display text-lg text-ink">{detail.ticket.subject}</h4>
              <div className="space-y-3 max-h-[380px] overflow-auto pr-1">
                {detail.messages.map((m) => (
                  <div key={m._id} className={`rounded-2xl px-4 py-3 text-sm ${m.authorRole === "admin" || m.authorRole === "support" ? "bg-primary/10 border border-primary/20" : "bg-white border border-edge"}`}>
                    <p className="text-ink">{m.body}</p>
                    <p className="text-[11px] text-ink-muted mt-1">{new Date(m.createdAt).toLocaleString("fa-IR")} · {m.authorRole}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="پاسخ…" className="flex-1 rounded-full border border-edge bg-white px-4 py-2.5 text-sm" onKeyDown={(e) => e.key === "Enter" && sendReply()} />
                <button onClick={sendReply} className="rounded-full bg-ink px-5 py-2.5 text-sm text-canvas">ارسال</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
