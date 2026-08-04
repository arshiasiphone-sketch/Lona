import { Link } from "react-router";
import { useState } from "react";
import { ArrowLeft, BadgeCheck, Instagram, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/glass";
import { LonaLogo } from "@/components/brand/LonaLogo";
import { useHomepageImages } from "@/lib/homepage-images";

const sections: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "بوتیک",
    links: [
      { label: "همه محصولات", to: "/shop" },
      { label: "سوتین", to: "/shop?category=intimates-bras" },
      { label: "شورت", to: "/shop?category=intimates-briefs" },
      { label: "لباس خواب", to: "/shop?category=sleepwear" },
      { label: "شلوارک خانگی", to: "/shop?category=homewear" },
      { label: "اکسسوری", to: "/shop?category=intimates-accessories" },
    ],
  },
  {
    title: "خانه لونا",
    links: [
      { label: "درباره ما", to: "/about" },
      { label: "مجله", to: "/press" },
      { label: "مسئولیت‌پذیری", to: "/about#sustainability" },
      { label: "فروشگاه‌ها", to: "/about#stores" },
    ],
  },
  {
    title: "خدمات مشتریان",
    links: [
      { label: "شرایط ارسال", to: "/shipping-policy" },
      { label: "بازگشت کالا", to: "/refund-policy" },
      { label: "راهنمای سایز", to: "/about#sizing" },
      { label: "تماس با ما", to: "/contact" },
    ],
  },
  {
    title: "قوانین",
    links: [
      { label: "قوانین و مقررات", to: "/rules" },
      { label: "حریم خصوصی", to: "/privacy" },
      { label: "شرایط بازگشت کالا", to: "/refund-policy" },
      { label: "سوالات متداول", to: "/faq" },
    ],
  },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const images = useHomepageImages();
  // Phase 8.2 — store legal/contact info from admin settings.
  const store = useQuery(api.admin_settings.getStoreInfo, {});

  return (
    <footer className="relative mt-32 overflow-hidden">
      {/* Top band — newsletter */}
      <div className="mx-auto max-w-[1728px] px-6 lg:px-10">
        <div className="glass-strong relative overflow-hidden rounded-3xl px-8 py-12 lg:px-14 lg:py-16">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-lona-blush/40 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-primary/15 blur-[120px]" />
          <div className="relative grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
            <div>
              <p className="type-eyebrow text-ink-muted">نامه‌ای از بوتیک</p>
              <h3 className="font-display text-3xl leading-[1.15] text-ink lg:text-5xl">
                هر فصل، یک یادداشت کوتاه از خانه لونا.
              </h3>
              <p className="mt-4 max-w-md text-sm text-ink-muted">
                داستان‌های پارچه، تازه‌ترین تکه‌های کالکسیون و گاهی یک قطعه‌ی
                خصوصی. بدون تبلیغات.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!email.trim()) return;
                setSubmitted(true);
                setTimeout(() => {
                  setEmail("");
                  setSubmitted(false);
                }, 3500);
              }}
              className="flex flex-col gap-3 self-end"
            >
              <label className="type-eyebrow text-ink-muted" htmlFor="newsletter">
                ایمیل شما
              </label>
              <div className="glass flex items-center gap-3 rounded-full px-4 py-2">
                <Mail className="h-4 w-4 text-ink-muted" />
                <input
                  id="newsletter"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                  dir="ltr"
                />
                <button
                  type="submit"
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full transition",
                    "bg-ink text-canvas hover:bg-primary"
                  )}
                  aria-label="عضویت"
                >
                  {submitted ? (
                    <span className="text-[10px]">سپاس</span>
                  ) : (
                    <ArrowLeft className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-ink-muted">
                با عضویت، قوانین حریم خصوصی لونا را می‌پذیرید.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Link sections */}
      <div className="mx-auto mt-20 max-w-[1728px] px-6 lg:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <div className="flex items-center gap-3">
              {images.logo && images.logo !== "/logo.svg" ? (
                <img src={images.logo} alt="لونا" className="h-11 w-auto" />
              ) : (
                <LonaLogo variant="default" size={44} />
              )}
              <div className="flex flex-col items-start leading-tight">
                <span className="font-latin-display text-2xl tracking-[0.32em] text-ink">
                  LONA
                </span>
                <span className="type-eyebrow mt-1 text-ink-muted">
                  بوتیک لباس زیر زنانه
                </span>
              </div>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ink-muted">
              لونا یک خانه‌ی طراحی لباس زیر زنانه است. تکه‌هایی که برای ماندن
              کنار شما ساخته شده‌اند — به آرامی، برای سال‌ها.
            </p>
            <Link
              to="https://instagram.com"
              className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-full hairline text-ink-soft transition hover:bg-white/40 hover:text-ink"
              aria-label="اینستاگرام"
            >
              <Instagram className="h-4 w-4" />
            </Link>
          </div>
          {sections.map((section) => (
            <div key={section.title}>
              <p className="type-eyebrow text-ink-muted">{section.title}</p>
              <ul className="mt-6 flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-ink-soft transition hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Trust band — payments, enamad placeholder, contact info */}
      <div className="mx-auto mt-14 max-w-[1728px] px-6 lg:px-10">
        <div className="glass flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-3xl px-6 py-5">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              پرداخت امن زرین‌پال
            </span>
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-primary" />
              ضمانت اصالت کالا
            </span>
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-primary" />
              ارسال سریع به سراسر کشور
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            {store?.phone && (
              <a
                href={`tel:${store.phone}`}
                dir="ltr"
                className="inline-flex items-center gap-1.5 text-ink-soft hover:text-ink"
              >
                <Phone className="h-3.5 w-3.5" />
                {store.phone}
              </a>
            )}
            {store?.address && (
              <span className="inline-flex items-center gap-1.5 text-ink-soft">
                <MapPin className="h-3.5 w-3.5" />
                <span className="max-w-64 truncate">{store.address}</span>
              </span>
            )}
            {/* eNamad placeholder — official badge drops in after
                issuance; the admin stores the code in settings. */}
            <a
              href="https://trustseal.enamad.ir/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-16 w-16 items-center justify-center rounded-xl hairline bg-white/60 text-center text-[8px] leading-tight text-ink-muted transition hover:bg-white"
              title={"نماد اعتماد الکترونیکی" + (store?.enamadCode ? ` — کد ${store.enamadCode}` : "")}
            >
              اینماد
              <br />
              eNamad
            </a>
          </div>
        </div>
      </div>

      {/* Bottom band */}
      <div className="mx-auto mt-10 max-w-[1728px] border-t border-edge/60 px-6 py-8 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-4 text-xs text-ink-muted md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} {store?.shopName || "لونا"} — بوتیک لباس زیر زنانه.
            {store?.nationalId && <> · شناسه ملی {store.nationalId}</>}
          </p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:text-ink">
              حریم خصوصی
            </Link>
            <Link to="/rules" className="hover:text-ink">
              قوانین و مقررات
            </Link>
            <Link to="/refund-policy" className="hover:text-ink">
              بازگشت کالا
            </Link>
            <select
              className="rounded-full hairline bg-transparent px-3 py-1 text-xs text-ink-muted"
              defaultValue="fa-ir"
              aria-label="منطقه"
            >
              <option value="fa-ir">ایران · فارسی</option>
              <option value="fa-af">افغانستان · فارسی</option>
              <option value="en-ir">International · EN</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
}
