import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  SearchX,
  ShoppingBag,
  Heart,
  Package,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  body?: string;
  cta?: { label: string; to: string };
  /** Optional onClick action button (e.g. Reset filters). */
  action?: { label: string; onClick: () => void };
  children?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  eyebrow,
  title,
  body,
  cta,
  action,
  children,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_LUXURY }}
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl px-10 py-24 text-center",
        "glass",
        className
      )}
    >
      {icon && (
        <span className="grid h-14 w-14 place-items-center rounded-full hairline bg-white/60">
          {icon}
        </span>
      )}
      {eyebrow && <p className="type-eyebrow mt-6 text-ink-muted">{eyebrow}</p>}
      <p className="mt-3 font-display text-3xl leading-tight text-ink lg:text-4xl">
        {title}
      </p>
      {body && (
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
          {body}
        </p>
      )}
      {children}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          {action.label}
          <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </button>
      )}
      {cta && (
        <Link
          to={cta.to}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
        >
          {cta.label}
          <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </Link>
      )}
    </motion.div>
  );
}

export function EmptySearch({
  query,
  onReset,
}: {
  query: string;
  onReset: () => void;
}) {
  return (
    <EmptyState
      icon={<SearchX className="h-5 w-5 text-ink" />}
      eyebrow="جستجو"
      title={`هیچ تکه‌ای برای «${query}» پیدا نشد.`}
      body="شاید یک دسته‌بندی، یک کالکسیون یا یک رنگ را امتحان کنید — کاتالوگ لونا به‌عمد کوچک نگه داشته می‌شود."
      action={{ label: "بازنشانی فیلترها", onClick: onReset }}
    />
  );
}

export function EmptyCart() {
  return (
    <div className="mx-auto max-w-2xl px-6 pt-28 pb-24 text-center lg:px-10">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full hairline bg-white/60">
        <ShoppingBag className="h-5 w-5 text-ink" />
      </span>
      <p className="type-eyebrow mt-6 text-ink-muted">کیف</p>
      <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-6xl">
        آرام، فعلاً.
      </h1>
      <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-ink-soft">
        سبد خرید شما خالی است. از تازه‌ترین تکه‌های این فصل شروع کنید.
      </p>
      <Link
        to="/shop"
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
      >
        مشاهدهٔ کالکسیون
        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
      </Link>
    </div>
  );
}

export function EmptyWishlist() {
  return (
    <div className="mt-16 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full hairline bg-white/60">
        <Heart className="h-5 w-5 text-ink" />
      </span>
      <p className="mt-6 font-display text-3xl text-ink lg:text-4xl">
        هنوز چیزی ذخیره نشده.
      </p>
      <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
        یک تکه را نشانه‌گذاری کنید تا اینجا نگه داشته شود. علاقه‌مندی‌ها تا نود روز ماندگارند.
      </p>
      <Link
        to="/shop"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
      >
        گشت در کالکسیون
        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
      </Link>
    </div>
  );
}

export function EmptyOrders() {
  return (
    <EmptyState
      icon={<Package className="h-5 w-5 text-ink" />}
      eyebrow="سفارش‌ها"
      title="هنوز سفارشی ثبت نشده است."
      body="با اولین سفارش شما در لونا، این صفحه شامل کد پیگیری، نام سازندگان و دستور تکرار بعدی شما خواهد شد."
      cta={{ label: "انتخاب یک تکه", to: "/shop" }}
    />
  );
}

export function EmptyFilter({ onReset }: { onReset: () => void }) {
  return (
    <EmptyState
      icon={<SlidersHorizontal className="h-5 w-5 text-ink" />}
      eyebrow="فیلتر شده"
      title="هیچ تکه‌ای با انتخاب فعلی هم‌خوانی ندارد."
      body="کران بالای قیمت را کمی بازتر کنید، فیلتر رنگ یا سایز را بردارید، یا به کاتالوگ کامل بازگردید."
      action={{ label: "بازنشانی فیلترها", onClick: onReset }}
    />
  );
}
