import { useState } from "react";
import { useMutation } from "convex/react";
import { useNavigate, useParams } from "react-router";
import { api } from "@/convex/_generated/api";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { useToast } from "@/lib/toast";

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const accept = useMutation(api.admin_team.acceptInvite);
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function handleAccept() {
    if (!token) return;
    setBusy(true);
    try {
      await accept({ token });
      toast.success("دعوت شما پذیرفته شد.");
      navigate("/admin", { replace: true });
    } catch (error) {
      toast.error((error as Error).message || "پذیرش دعوت ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-canvas-soft px-6" dir="rtl">
      <section className="w-full max-w-md rounded-3xl border border-edge bg-white/90 p-8 text-center shadow-sm">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <p className="mt-5 type-eyebrow text-ink-muted">دعوت تیم مدیریتی</p>
        <h1 className="mt-2 font-display text-3xl text-ink">پیوستن به تیم لونا</h1>
        <p className="mt-3 text-sm leading-7 text-ink-soft">
          برای پذیرش دعوت، ابتدا با همان ایمیلی که دعوت شده‌اید وارد حساب شوید.
          این دعوت فقط یک‌بار و تا هفت روز معتبر است.
        </p>
        <button
          type="button"
          onClick={() => void handleAccept()}
          disabled={busy || !token}
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-canvas transition hover:bg-primary disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          پذیرش دعوت
        </button>
      </section>
    </main>
  );
}
