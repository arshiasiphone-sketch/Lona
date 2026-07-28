/**
 * Lona — Benefits grid.
 *
 * Four quiet benefit cards rendered as 01–04 serif numerals + headline
 * + paragraph. No big icons, no badges — the language is the design.
 * Hairline-bordered glass cards, generous whitespace.
 */
import { motion } from "framer-motion";
import { EASE_LUXURY } from "@/lib/motion";

interface Benefit {
  num: string;
  title: string;
  body: string;
}

const BENEFITS: Benefit[] = [
  {
    num: "۰۱",
    title: "ارسال سریع",
    body: "سفارش‌ها با بسته‌بندی مناسب و در کوتاه‌ترین زمان ارسال می‌شوند.",
  },
  {
    num: "۰۲",
    title: "بسته‌بندی محرمانه",
    body: "تمام سفارش‌ها با حفظ حریم خصوصی مشتریان ارسال می‌شوند.",
  },
  {
    num: "۰۳",
    title: "کیفیت انتخاب‌شده",
    body: "محصولات با تمرکز بر کیفیت پارچه و راحتی انتخاب می‌شوند.",
  },
  {
    num: "۰۴",
    title: "پشتیبانی",
    body: "در انتخاب سایز و ثبت سفارش همراه شما هستیم.",
  },
];

export function Benefits({
  eyebrow = "مزایای لونا",
  title = "چهار دلیل برای اعتماد",
}: {
  eyebrow?: string;
  title?: string;
}) {
  return (
    <section
      className="mx-auto mt-36 max-w-[1728px] px-6 lg:px-10"
      aria-label={eyebrow}
    >
      <div className="max-w-2xl">
        <p className="type-eyebrow text-ink-muted">{eyebrow}</p>
        <h2 className="mt-3 font-display text-4xl font-light leading-[1.1] text-ink lg:text-5xl">
          {title}
        </h2>
      </div>

      <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-edge bg-edge md:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((b, i) => (
          <motion.article
            key={b.num}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: EASE_LUXURY, delay: i * 0.08 }}
            className="bg-canvas-soft/70 p-8 lg:p-10"
          >
            <p className="font-display text-5xl font-light leading-none text-ink/85 lg:text-6xl">
              {b.num}
            </p>
            <h3 className="mt-8 font-display text-xl font-medium leading-snug text-ink">
              {b.title}
            </h3>
            <p className="mt-3 font-sans text-sm font-light leading-[1.85] text-ink-soft">
              {b.body}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}