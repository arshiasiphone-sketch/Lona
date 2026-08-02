/**
 * Lona — Magazine article page (`/press/:slug`).
 *
 * Renders the live Convex editorial (falling back to the static
 * catalog while loading). Uses the editorial's own cover image when
 * an admin uploaded one; otherwise the shared press imagery + the
 * gradient tone remain the fallback.
 */
import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { useEditorial } from "@/lib/data/catalog";
import { useHomepageImages } from "@/lib/homepage-images";
import { usePageMeta } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { EditorialImage } from "@/components/ui/EditorialImage";

const categoryLabel: Record<string, string> = {
  journal: "مجله",
  atelier: "یادداشت کارگاه",
  campaign: "کالکسیون",
  blog: "بلاگ",
};

const gradientMap: Record<string, string> = {
  mist: "gradient-mist",
  oat: "gradient-oat",
  rose: "gradient-rose-quartz",
  deep: "gradient-deep",
};

export default function PressArticle() {
  const { slug = "" } = useParams();
  const editorial = useEditorial(slug);
  const images = useHomepageImages();

  usePageMeta({
    title: editorial
      ? `${editorial.title} | مجله لونا`
      : "نوشته یافت نشد",
    description: editorial?.excerpt?.slice(0, 155) ?? "مجله لونا",
    canonical: editorial
      ? `${window.location.origin}/press/${editorial.slug}`
      : undefined,
    ogType: "article",
    noindex: !editorial,
  });

  if (!editorial) {
    return (
      <div className="mx-auto max-w-2xl px-6 pt-32 pb-24 text-center">
        <h1 className="font-display text-3xl text-ink">
          این نوشته در مجله پیدا نشد.
        </h1>
        <Link
          to="/press"
          className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          بازگشت به مجله
        </Link>
      </div>
    );
  }

  const gradientClass = gradientMap[editorial.cover] ?? "gradient-oat";
  const onDark = editorial.cover === "deep";

  return (
    <div className="mx-auto max-w-[1728px] px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em]">
        <Link
          to="/press"
          className="text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
          مجله
        </Link>
        <ArrowRight className="h-3 w-3 rtl:rotate-180 text-ink-muted" />
        <span className="text-ink">{categoryLabel[editorial.category]}</span>
      </nav>

      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_LUXURY }}
        className="mt-10 max-w-4xl"
      >
        <p className="type-eyebrow text-ink-muted">
          {categoryLabel[editorial.category]} · {formatDate(editorial.publishedAt)} ·{" "}
          {editorial.author}
        </p>
        <h1 className="mt-5 font-display text-5xl leading-[1.02] text-ink lg:text-8xl">
          {editorial.title}
        </h1>
        <p className="mt-8 max-w-2xl text-base leading-relaxed text-ink-soft lg:text-lg">
          {editorial.excerpt}
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, scale: 0.995 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: EASE_LUXURY, delay: 0.15 }}
        className="mt-14 overflow-hidden rounded-3xl"
      >
        <EditorialImage
          src={editorial.coverImage || images.press_hero}
          alt={`${editorial.title} — تصویر کاور مجله لونا`}
          className={cn("relative aspect-[16/7]", gradientClass)}
          imgClassName="opacity-95"
          priority
        >
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/40" />
        </EditorialImage>
      </motion.div>

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE_LUXURY, delay: 0.25 }}
        className={cn(
          "mx-auto mt-16 max-w-2xl space-y-8 font-sans text-base leading-[2.05]",
          onDark ? "text-ink" : "text-ink-soft",
        )}
      >
        <p>{editorial.excerpt}</p>
        <p>
          نوشته‌های کامل به‌زودی در مجلهٔ لونا منتشر می‌شوند. در همین حال
          کالکسیون‌های فصل را در فروشگاه ببینید یا برای دریافت نامهٔ فصلی،
          ایمیل خود را در پایان همین صفحه ثبت کنید.
        </p>
        <div className="flex items-center gap-3 pt-4">
          <div className="h-px w-8 bg-ink/35" />
          <span className="font-latin-display text-sm tracking-[0.32em] text-ink">
            LONA
          </span>
        </div>
      </motion.article>

      <div className="mt-20 text-center">
        <Link
          to="/shop"
          className="group inline-flex items-center gap-3 rounded-full bg-ink px-7 py-3.5 text-[12px] font-medium uppercase tracking-[0.18em] text-canvas transition hover:bg-primary"
        >
          مشاهده کالکسیون‌های فصل
          <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:translate-x-0 rtl:group-hover:-translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
