import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

export default function SupportAdminPage() {
  const tickets = useQuery(api.support.listAllTickets, {});
  const [sel, setSel] = useState<Id<"support_tickets"> | null>(null);
  const detail = useQuery(api.support.getTicketWithMessages, sel ? { ticketId: sel } : "skip");
  const reply = useMutation(api.support.replyTicket);
  const setStatus = useMutation(api.support.setTicketStatus);
  const [body, setBody] = useState("");
  if (!tickets) return <div className="grid place-items-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-ink">پشتیبانی — تیکت‌ها</h1>
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-2">
          {tickets.map((t) => (
            <button key={t._id} onClick={() => setSel(t._id)} className={`w-full text-right rounded-2xl border px-4 py-3 ${sel === t._id ? "bg-ink text-canvas border-ink" : "bg-white border-edge"}`}>
              <p className="text-sm font-medium truncate">{t.subject}</p>
              <p className="text-xs opacity-70">{t.status} · {t.category} · {new Date(t.updatedAt).toLocaleDateString("fa-IR")}</p>
            </button>
          ))}
          {tickets.length === 0 && <p className="text-sm text-ink-muted text-center py-8">تیکتی نیست.</p>}
        </div>
        <div className="rounded-3xl border border-edge bg-white p-6 min-h-[360px]">
          {!sel ? <p className="text-sm text-ink-muted">تیکتی را انتخاب کنید.</p> : !detail ? <Loader2 className="h-5 w-5 animate-spin" /> : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(["new", "reviewing", "answered", "closed"] as const).map((s) => (
                  <button key={s} onClick={() => setStatus({ ticketId: sel, status: s })} className={`rounded-full px-3 py-1.5 text-xs border ${detail.ticket.status === s ? "bg-ink text-canvas border-ink" : "bg-white border-edge"}`}>{s}</button>
                ))}
              </div>
              <div className="space-y-2 max-h-[380px] overflow-auto">
                {detail.messages.map((m) => (
                  <div key={m._id} className="rounded-2xl border border-edge bg-canvas-soft px-4 py-2.5 text-sm">
                    <p>{m.body}</p>
                    <p className="text-[11px] text-ink-muted mt-1">{new Date(m.createdAt).toLocaleString("fa-IR")}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="پاسخ…" className="flex-1 rounded-full border border-edge bg-white px-4 py-2 text-sm" />
                <button onClick={async () => { await reply({ ticketId: sel, body }); setBody(""); }} className="rounded-full bg-ink px-5 py-2 text-sm text-canvas">ارسال</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
