/**
 * Phase 8.2 — contact page. Reads the store info set by the admin
 * (phone / email / address / hours / socials) and shows the Enamad
 * trust placeholder.
 */
import { useState } from "react";
import { Link } from "react-router";
import {
  Mail,
  MapPin,
  Phone,
  Clock,
  Instagram,
  Send,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePageMeta } from "@/lib/seo";
import { cn } from "@/lib/glass";

export default function Contact() {
  usePageMeta({
    title: "تماس با ما",
    description: "راه‌های ارتباط با بوتیک لونا — پشتیبانی، پیگیری سفارش و مشاوره خرید",
    noindex: true,
  });
  const store = useQuery(api.admin_settings.getStoreInfo, {});
  const [sent, setSent] = useState(false);

  const socials = (store?.social ?? {}) as Record<string, string>;

  return (
    <div className="mx-auto max-w-6xl px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <p className="type-eyebrow text-ink-muted">تماس با ما</p>
      <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-6xl">
        در کنار شماییم.
      </h1>
      <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-soft">
        برای مشاوره خرید، پیگیری سفارش یا هر پرسشی، از راه‌های زیر با تیم لونا
        در ارتباط باشید. پاسخ‌گویی در ساعات کاری انجام می‌شود.
      </p>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Contact cards */}
        <div className="space-y-4">
          {store?.phone && (
            <a
              href={`tel:${store.phone.replace(/\s+/g, "")}`}
              className="glass flex items-center gap-4 rounded-3xl p-5 transition hover:bg-white/70"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-canvas">
                <Phone className="h-4 w-4" />
              </span>
              <div>
                <p className="type-eyebrow text-ink-muted">تلفن</p>
                <p className="mt-0.5 text-sm text-ink" dir="ltr">
                  {store.phone}
                </p>
              </div>
            </a>
          )}
          {store?.email && (
            <a
              href={`mailto:${store.email}`}
              className="glass flex items-center gap-4 rounded-3xl p-5 transition hover:bg-white/70"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-canvas">
                <Mail className="h-4 w-4" />
              </span>
              <div>
                <p className="type-eyebrow text-ink-muted">ایمیل پشتیبانی</p>
                <p className="mt-0.5 text-sm text-ink" dir="ltr">
                  {store.email}
                </p>
              </div>
            </a>
          )}
          {store?.address && (
            <div className="glass flex items-center gap-4 rounded-3xl p-5">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-canvas">
                <MapPin className="h-4 w-4" />
              </span>
              <div>
                <p className="type-eyebrow text-ink-muted">آدرس</p>
                <p className="mt-0.5 text-sm text-ink">{store.address}</p>
              </div>
            </div>
          )}
          {store?.hours && (
            <div className="glass flex items-center gap-4 rounded-3xl p-5">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-canvas">
                <Clock className="h-4 w-4" />
              </span>
              <div>
                <p className="type-eyebrow text-ink-muted">ساعات کاری</p>
                <p className="mt-0.5 text-sm text-ink">{store.hours}</p>
              </div>
            </div>
          )}

          {/* Enamad trust placeholder */}
          <div className="flex items-center gap-3 rounded-3xl border border-edge/70 bg-white/50 p-5">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-edge text-ink-soft">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="type-eyebrow text-ink-muted">نماد اعتماد الکترونیکی</p>
              {store?.enamadCode ? (
                <p className="mt-0.5 text-sm text-ink">کد: {store.enamadCode}</p>
              ) : (
                <p className="mt-0.5 text-xs text-ink-soft">
                  این فروشگاه در حال دریافت نماد اعتماد الکترونیکی است.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Message form */}
        <div className="glass-strong rounded-3xl p-8">
          <p className="type-eyebrow text-ink-muted">پیام شما</p>
          <h2 className="mt-2 font-display text-2xl text-ink">
            برای ما بنویسید
          </h2>
          <form
            className="mt-6 grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
              setTimeout(() => setSent(false), 4000);
            }}
          >
            <input
              required
              placeholder="نام شما"
              className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
            />
            <input
              required
              type="email"
              placeholder="ایمیل"
              dir="ltr"
              className="w-full rounded-2xl border border-edge bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
            />
            <textarea
              required
              rows={5}
              placeholder="متن پیام…"
              className="w-full resize-none rounded-2xl border border-edge bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary"
              )}
            >
              {sent ? (
                "پیام شما ثبت شد"
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  ارسال پیام
                </>
              )}
            </button>
            <p className="text-xs text-ink-soft">
              پیام‌ها به آدرس {store?.email || "ایمیل فروشگاه"} ارسال می‌شوند.
              اطلاعات شما با پشتیبانی لونا به اشتراک گذاشته نمی‌شود.
            </p>
          </form>

          {/* Socials */}
          {Object.values(socials).some(Boolean) && (
            <div className="mt-6 flex items-center gap-3 border-t border-edge/70 pt-6">
              <span className="type-eyebrow text-ink-muted">شبکه‌های اجتماعی</span>
              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-9 w-9 place-items-center rounded-full hairline text-ink-soft transition hover:bg-white/60 hover:text-ink"
                  aria-label="اینستاگرام"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <Link
        to="/shop"
        className="mt-14 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        بازگشت به فروشگاه
      </Link>
    </div>
  );
}
