import { Link } from "react-router";
import { useState } from "react";
import { ArrowLeft, Instagram, Mail } from "lucide-react";
import { cn } from "@/lib/glass";
import { LonaLogo } from "@/components/brand/LonaLogo";

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
      { label: "ارسال و بازگشت", to: "/about" },
      { label: "راهنمای سایز", to: "/about" },
      { label: "مراقبت از پارچه", to: "/about" },
      { label: "تماس با ما", to: "/about#contact" },
    ],
  },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

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
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-3">
              <LonaLogo variant="default" size={44} />
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

      {/* Bottom band */}
      <div className="mx-auto mt-20 max-w-[1728px] border-t border-edge/60 px-6 py-8 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-4 text-xs text-ink-muted md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} لونا — بوتیک لباس زیر زنانه. تأسیس ۱۳۹۸.
          </p>
          <div className="flex items-center gap-5">
            <Link to="/about" className="hover:text-ink">
              حریم خصوصی
            </Link>
            <Link to="/about" className="hover:text-ink">
              کوکی‌ها
            </Link>
            <Link to="/about" className="hover:text-ink">
              شرایط استفاده
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
