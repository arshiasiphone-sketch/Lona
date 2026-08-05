/**
 * Phase 8.2/8.3 — payment callback page.
 *
 * Zarinpal redirects the customer back here after payment:
 *   /checkout/callback/:orderId?Status=…&Authority=…
 *
 * NEVER trust the browser: the visible `status` param is only a hint.
 * The page calls the server-side `payments.verifyPayment` action,
 * which re-checks authority + amount against Zarinpal and is the only
 * thing that may flip the order to paid.
 *
 * Reliability guarantees (Phase 8.3):
 *   • Order info (number, total, customer) is read reactively from the
 *     live `orders.getById` query — never snapshotted, so whichever of
 *     verify/query resolves first, the UI converges to the truth.
 *   • The verify action is idempotent server-side (double callback /
 *     retries are safe).
 *   • A transient gateway/network failure surfaces a retry + cancel
 *     path instead of a dead end; the reservation-expiry cron still
 *     releases the hold if the customer abandons.
 *   • A client-side timeout (30 s) turns a hung verification into the
 *     same retryable state.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  Ban,
} from "lucide-react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useCart } from "@/hooks/use-cart";
import { useDeviceSession } from "@/lib/data/session";
import { EASE_LUXURY } from "@/lib/motion";
import { formatPrice } from "@/lib/money";

type Phase = "verifying" | "paid" | "failed" | "retryable" | "missing";

/** Client-side guard so a hung gateway request can't spin forever. */
const VERIFY_TIMEOUT_MS = 30_000;

/**
 * Codes the server action throws when the failure is transient — the
 * payment MAY have succeeded on the gateway side, so the order is
 * still live and the customer should retry (never mark it failed).
 */
function isTransientError(message: string): boolean {
  return (
    message.includes("ZARINPAL_VERIFY_UNAVAILABLE") ||
    message.includes("VERIFY_TIMEOUT") ||
    message === ""
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("VERIFY_TIMEOUT")),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export default function CheckoutCallback() {
  const params = useParams<{ orderId: string }>();
  const query = new URLSearchParams(window.location.search);
  // Zarinpal's callback uses title-case parameter names. Keep the
  // lowercase fallback for older/test callbacks, but never rely on the
  // visible status for settlement — the server action verifies it.
  const authority = query.get("Authority") ?? query.get("authority") ?? "";
  const gatewayStatus = query.get("Status") ?? query.get("status") ?? "";
  const verify = useAction(api.payments.verifyPayment);
  const cancelPendingMut = useMutation(api.orders.cancelPending);
  const { clear } = useCart();
  const sessionId = useDeviceSession();
  const setCartMeta = useMutation(api.cart.setMeta);

  const [phase, setPhase] = useState<Phase>("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const started = useRef(false);
  // Guards the cart/coupon cleanup so it runs once even when the
  // paid-convergence effect fires multiple times (StrictMode).
  const settledRef = useRef(false);

  // The order id rides in the URL path (see ZarinpalProvider):
  // /checkout/callback/:orderId?Status=…&Authority=…
  const pathOrderId = params?.orderId ?? "";

  // Live, owner-scoped order — the single source of truth for display.
  // Number / total / customer name are read from here in the render so
  // there is no snapshot state that can go stale.
  const orderData = useQuery(
    api.orders.getById,
    pathOrderId ? { id: pathOrderId as Id<"orders"> } : "skip"
  );

  const runVerification = useCallback(async () => {
    setPhase("verifying");
    setErrorMessage("");
    try {
      const result = await withTimeout(
        verify({
          orderId: pathOrderId as Id<"orders">,
          authority,
        }),
        VERIFY_TIMEOUT_MS
      );
      if (result.status === "paid") {
        setPhase("paid");
        // Payment confirmed — drop the used coupon + empty the cart.
        if (sessionId) {
          await setCartMeta({ sessionId, couponCode: undefined }).catch(
            () => {}
          );
        }
        clear();
      } else {
        // The server already cancelled the order on a gateway decline.
        setErrorMessage(result.message ?? "");
        setPhase("failed");
      }
    } catch (err) {
      const message = (err as Error)?.message ?? "";
      if (isTransientError(message)) {
        // Order still live + reservation still held — offer retry.
        setErrorMessage(
          "ارتباط با درگاه پرداخت قطع شد. اگر پرداخت شما انجام شده، دوباره تأیید کنید؛ در غیر این صورت رزرو موجودی پس از ۳۰ دقیقه به‌صورت خودکار آزاد می‌شود."
        );
        setPhase("retryable");
      } else {
        setErrorMessage(message);
        setPhase("failed");
      }
    }
  }, [verify, pathOrderId, authority, sessionId, setCartMeta, clear]);

  // Initial verification — runs once (guarded against StrictMode's
  // double effect invocation).
  useEffect(() => {
    if (started.current) return;
    if (!authority || !pathOrderId) {
      setPhase("missing");
      return;
    }
    started.current = true;
    void runVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authority, pathOrderId]);

  // If the order already settled server-side (verify won the race
  // against the query, or the user refreshed after success), converge
  // the UI to paid without waiting for a second verify call. The
  // cart/coupon cleanup is side-effect-free inside the render path and
  // guarded by `settledRef` so it runs exactly once.
  useEffect(() => {
    if (orderData?.paymentStatus === "paid") {
      if (!settledRef.current) {
        settledRef.current = true;
        if (sessionId) {
          void setCartMeta({ sessionId, couponCode: undefined }).catch(
            () => {}
          );
        }
        clear();
      }
      setPhase("paid");
      return;
    }
    // Cron expired the payment window while the user was looking at
    // the page — the reservation is already released server-side.
    if (
      phase === "verifying" &&
      orderData &&
      (orderData.status === "cancelled" ||
        orderData.paymentStatus === "cancelled" ||
        orderData.paymentStatus === "failed")
    ) {
      setPhase("failed");
      setErrorMessage(
        "پرداخت در مهلت مقرر تکمیل نشد و سفارش لغو شد. موجودی رزرو شده آزاد شد."
      );
    }
  }, [orderData, phase, sessionId, setCartMeta, clear]);

  const cancelPayment = async () => {
    if (cancelling || !pathOrderId) return;
    setCancelling(true);
    try {
      await cancelPendingMut({
        orderId: pathOrderId as Id<"orders">,
        paymentStatus: "cancelled",
        note: "انصراف مشتری از ادامه پرداخت پس از ناتمام ماندن در درگاه",
      });
      setErrorMessage(
        "سفارش لغو شد و موجودی رزرو شده آزاد شد. سبد خرید شما حفظ شده است."
      );
      setPhase("failed");
    } catch {
      setErrorMessage("لغو سفارش ناموفق بود؛ لطفاً دوباره تلاش کنید.");
    } finally {
      setCancelling(false);
    }
  };

  const orderNumber = orderData?.number ?? "";
  const totalCents = orderData?.totalCents ?? 0;
  const customerName = orderData?.shipping?.fullName ?? "";

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
            {orderNumber && (
              <p className="mt-4 text-xs text-ink-muted">
                سفارش {orderNumber}
              </p>
            )}
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
            {customerName && (
              <p className="mt-4 text-sm text-ink-soft">
                {customerName} عزیز، سفارش شما با موفقیت ثبت شد.
              </p>
            )}
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
              {errorMessage ||
                (gatewayStatus === "NOK"
                  ? "پرداخت توسط شما لغو شد یا در درگاه ناتمام ماند. موجودی رزرو شده آزاد شد و می‌توانید دوباره تلاش کنید."
                  : "متأسفانه پرداخت شما تأیید نشد. موجودی رزرو شده آزاد شد و می‌توانید دوباره تلاش کنید.")}
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

        {phase === "retryable" && (
          <div>
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full hairline bg-amber-50 text-amber-700">
              <RefreshCw className="h-8 w-8" />
            </div>
            <p className="type-eyebrow mt-8 text-ink-muted">
              تأیید پرداخت ناتمام ماند
            </p>
            <h1 className="mt-3 font-display text-4xl text-ink lg:text-5xl">
              ارتباط با درگاه قطع شد.
            </h1>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink-soft">
              {errorMessage}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => void runVerification()}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                تلاش دوباره برای تأیید
              </button>
              <button
                onClick={() => void cancelPayment()}
                disabled={cancelling}
                className="inline-flex items-center gap-2 rounded-full hairline bg-canvas/60 px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft hover:bg-white disabled:opacity-50"
              >
                {cancelling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Ban className="h-3.5 w-3.5" />
                )}
                انصراف از پرداخت
              </button>
            </div>
            <p className="mx-auto mt-6 max-w-sm text-[11px] leading-relaxed text-ink-muted">
              اگر پرداخت شما انجام شده ولی این صفحه به خطا خورد، «تلاش دوباره»
              را بزنید — بررسی مجدد امن است و سفارش را تکراری نمی‌کند.
            </p>
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
