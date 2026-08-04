/**
 * Phase 8.2 — payment callback page.
 *
 * Zarinpal redirects the customer back here after payment:
 *   /checkout/callback/:orderId?Status=…&Authority=…
 *
 * NEVER trust the browser: the visible `status` param is only a hint.
 * The page calls the server-side `payments.verifyPayment` action,
 * which re-checks authority + amount against Zarinpal and is the only
 * thing that may flip the order to paid.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import { Check, X, Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCart } from "@/hooks/use-cart";
import { useDeviceSession } from "@/lib/data/session";
import { EASE_LUXURY } from "@/lib/motion";
import { formatPrice } from "@/lib/money";

type Phase = "verifying" | "paid" | "failed" | "missing";

export default function CheckoutCallback() {
  const params = useParams<{ orderId: string }>();
  const query = new URLSearchParams(window.location.search);
  const authority = query.get("authority") ?? "";
  const gatewayStatus = query.get("status") ?? "";
  const verify = useAction(api.payments.verifyPayment);
  const { clear } = useCart();
  const sessionId = useDeviceSession();
  const setCartMeta = useMutation(api.cart.setMeta);

  const [phase, setPhase] = useState<Phase>("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const started = useRef(false);

  // The order id rides in the URL path (see ZarinpalProvider):
  // /checkout/callback/:orderId?Status=…&Authority=…
  const pathOrderId = params?.orderId ?? "";

  // Fetch the order for display (owner-scoped server-side).
  const orderData = useQuery(
    api.orders.getById,
    pathOrderId ? { id: pathOrderId as Id<"orders"> } : "skip"
  );

  useEffect(() => {
    if (started.current) return;
    if (!authority || !pathOrderId) {
      setPhase("missing");
      return;
    }
    started.current = true;

    const run = async () => {
      try {
        const result = await verify({
          orderId: pathOrderId as Id<"orders">,
          authority,
        });
        if (result.status === "paid") {
          setOrderNumber(orderData?.number ?? "");
          setPhase("paid");
          // Payment confirmed — drop the used coupon + empty the cart.
          if (sessionId) {
            await setCartMeta({ sessionId, couponCode: undefined }).catch(
              () => {}
            );
          }
          clear();
        } else {
          setErrorMessage(result.message ?? "");
          setPhase("failed");
        }
      } catch (err) {
        setErrorMessage((err as Error)?.message ?? "");
        setPhase("failed");
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authority, pathOrderId]);

  const totalCents = orderData?.totalCents ?? 0;

  return (
    <div className="mx-auto max-w-2xl px-6 pt-32 pb-24 text-center lg:px-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_LUXURY }}
      >
        {phase === "verifying" && (
          <div>
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-ink text-canvas">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <p className="type-eyebrow mt-8 text-ink-muted">تأیید پرداخت</p>
            <h1 className="mt-3 font-display text-4xl text-ink lg:text-5xl">
              در حال تأیید با درگاه…
            </h1>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-soft">
              نتیجه پرداخت مستقیماً از درگاه زرین‌پال بررسی می‌شود. لطفاً چند
              لحظه صبر کنید.
            </p>
          </div>
        )}

        {phase === "paid" && (
          <div>
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: EASE_LUXURY }}
              className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-ink text-canvas"
            >
              <Check className="h-9 w-9" />
            </motion.div>
            <p className="type-eyebrow mt-8 text-ink-muted">
              پرداخت تأیید شد{orderNumber ? ` · سفارش ${orderNumber}` : ""}
            </p>
            <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-6xl">
              سپاس از شما.
            </h1>
            {totalCents > 0 && (
              <p className="mt-5 text-sm text-ink-soft">
                مبلغ {formatPrice(totalCents)} با موفقیت پرداخت شد. سفارش شما
                وارد مرحله آماده‌سازی شد.
              </p>
            )}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
              >
                پیگیری سفارش
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/shop"
                className="rounded-full hairline bg-canvas/60 px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft hover:bg-white"
              >
                ادامه خرید
              </Link>
            </div>
          </div>
        )}

        {phase === "failed" && (
          <div>
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-destructive/10 text-destructive">
              <X className="h-9 w-9" />
            </div>
            <p className="type-eyebrow mt-8 text-ink-muted">پرداخت ناموفق</p>
            <h1 className="mt-3 font-display text-4xl text-ink lg:text-5xl">
              پرداخت کامل نشد.
            </h1>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-soft">
              {errorMessage || gatewayStatus === "NOK"
                ? "پرداخت توسط شما لغو شد یا در درگاه ناتمام ماند. موجودی رزرو شده آزاد شد و می‌توانید دوباره تلاش کنید."
                : "متأسفانه پرداخت شما تأیید نشد. موجودی رزرو شده آزاد شد و می‌توانید دوباره تلاش کنید."}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/cart"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
              >
                بازگشت به سبد خرید
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/shop"
                className="rounded-full hairline bg-canvas/60 px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft hover:bg-white"
              >
                فروشگاه
              </Link>
            </div>
          </div>
        )}

        {phase === "missing" && (
          <div>
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full hairline text-ink-soft">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <p className="type-eyebrow mt-8 text-ink-muted">درگاه پرداخت</p>
            <h1 className="mt-3 font-display text-4xl text-ink lg:text-5xl">
              اطلاعات پرداخت یافت نشد.
            </h1>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-soft">
              این صفحه باید از طریق درگاه پرداخت باز شود. به سبد خرید برگردید و
              دوباره اقدام کنید.
            </p>
            <Link
              to="/cart"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
            >
              بازگشت به سبد خرید
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
