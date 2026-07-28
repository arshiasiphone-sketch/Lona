/**
 * Phase 5.1 — shared stub page used by every non-Product admin
 * route (Categories / Collections / Inventory / Orders / Customers /
 * Reviews / Coupons / Editorial / Media / Settings).
 *
 * Each route renders the same shell but supplies its own copy via
 * route param. Once a domain grows a real surface, the route is
 * swapped to point at a dedicated page; the AdminShell and
 * RequireRole wrappers don't move.
 */
import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Blocks,
  Boxes,
  CalendarRange,
  Camera,
  Database,
  FileText,
  Image as ImageIcon,
  ListTree,
  Newspaper,
  Percent,
  Receipt,
  Settings as SettingsIcon,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";

export default function AdminStub() {
  const { domain } = useParams();
  const spec =
    DOMAIN_MAP[domain ?? ""] ??
    FALLBACK;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_LUXURY }}
      className="grid gap-6 lg:grid-cols-[2fr_1fr]"
    >
      <div className="rounded-3xl border border-edge bg-white/85 p-10">
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          <span className="grid h-7 w-7 place-items-center rounded-full hairline bg-white text-primary">
            {ICONS[spec.icon] ?? <Blocks className="h-3 w-3" />}
          </span>
          {spec.eyebrow}
        </div>
        <h1 className="mt-3 font-display text-4xl text-ink lg:text-5xl">
          {spec.title}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">
          {spec.body}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
          >
            شروع با کالکسیون <ArrowLeft className="h-3 w-3" />
          </Link>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-full hairline bg-canvas/70 px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-ink hover:bg-white"
          >
            بازگشت به نمای کلی
          </Link>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-edge bg-white/85 p-6">
          <p className="type-eyebrow text-ink-muted">مراحل بعدی</p>
          <ul className="mt-4 space-y-2">
            {spec.upNext.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-ink"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-edge bg-white/85 p-6">
          <p className="type-eyebrow text-ink-muted">دسترسی‌ها</p>
          <p className="mt-3 text-[12px] uppercase tracking-[0.18em] text-ink-soft">
            {spec.permission}
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            احراز هویت در سرور بررسی می‌شود. در صورت نداشتن نقش لازم، منوی
            کناری این بخش را نمایش نمی‌دهد.
          </p>
        </div>
      </aside>
    </motion.div>
  );
}

type Spec = {
  eyebrow: string;
  title: string;
  body: string;
  icon: keyof typeof ICONS;
  permission: string;
  upNext: string[];
};

const ICONS: Record<string, React.ReactNode> = {
  Tree: <ListTree className="h-3 w-3" />,
  Collection: <Boxes className="h-3 w-3" />,
  Boxes: <Boxes className="h-3 w-3" />,
  Receipt: <Receipt className="h-3 w-3" />,
  Wallet: <Wallet className="h-3 w-3" />,
  Newspaper: <Newspaper className="h-3 w-3" />,
  FileText: <FileText className="h-3 w-3" />,
  Camera: <Camera className="h-3 w-3" />,
  Image: <ImageIcon className="h-3 w-3" />,
  Settings: <SettingsIcon className="h-3 w-3" />,
  Inventory: <Truck className="h-3 w-3" />,
  Customers: <BarChart3 className="h-3 w-3" />,
  Reviews: <ShieldCheck className="h-3 w-3" />,
  Calendar: <CalendarRange className="h-3 w-3" />,
  Coupons: <Percent className="h-3 w-3" />,
  Data: <Database className="h-3 w-3" />,
};

const DOMAIN_MAP: Record<string, Spec> = {
  categories: {
    eyebrow: "کالکسیون · دسته‌بندی‌ها",
    title: "دسته‌بندی، در حال تکمیل.",
    body:
      "در حال حاضر دسته‌بندی‌ها در فیلتر فروشگاه به‌صورت تک‌انتخابی است. در فاز بعدی، دسته‌بندی‌ها به ساختار درختی با والد، فرزند، ترتیب و قابلیت دیده‌شدن ارتقا پیدا می‌کنند و گردش کار تخصیص محصول به آن‌ها افزوده می‌شود.",
    icon: "Tree",
    permission: "مدیریت محصولات",
    upNext: [
      "ساخت درخت با قابلیت کشیدن و رها کردن برای مرتب‌سازی",
      "دسته‌بندی‌های تو در تو برای فصل بهار و تابستان ۱۴۰۵",
    ],
  },
  collections: {
    eyebrow: "کالکسیون · مجموعه‌ها",
    title: "داستان‌های مجموعه‌ها، به‌زودی.",
    body:
      "در فاز ۵.۱، مجموعه‌ها به‌عنوان یک فیلد روی محصول قرار گرفته‌اند. ویرایشگر کامل مجموعه‌ها (چیدمان کمپین، ترتیب، ترکیب آرشیو) در تکه بعدی ادمین اضافه می‌شود.",
    icon: "Collection",
    permission: "مدیریت محصولات",
    upNext: [
      "مرتب‌سازی کارت‌ها در مجموعه با کشیدن و رها کردن",
      "ویرایشگر تصویر جلد فصلی",
    ],
  },
  inventory: {
    eyebrow: "کالکسیون · موجودی",
    title: "موجودی در یک نگاه.",
    body:
      "تنوع‌ها همراه با موجودی، SKU و وضعیت در دسترس ارائه می‌شوند؛ ماتریس ویزارد عمیق‌ترین سطح است. ثبت حرکت‌های موجودی بر اساس انبار و صندوق هشدار کمبود، در فاز بعدی اضافه می‌شود.",
    icon: "Inventory",
    permission: "مدیریت موجودی",
    upNext: [
      "دفتر کل انتقال‌های انبار",
      "هشدار ایمیلی کمبود موجودی به تأمین‌کنندگان",
    ],
  },
  media: {
    eyebrow: "کالکسیون · کتابخانه رسانه",
    title: "کتابخانه تصاویر، در حال تکمیل.",
    body:
      "تصاویر محصول از طریق MediaUploader بارگذاری می‌شوند. کتابخانه مشترک بین محصولات (جستجو بر اساس متن جایگزین، فیلتر برچسب، بازیافت تصاویر بدون استفاده) در فاز ۵.۲ ارائه می‌شود.",
    icon: "Image",
    permission: "مدیریت رسانه",
    upNext: [
      "جستجو بر اساس متن جایگزین یا برچسب",
      "ردیابی استفاده — هر تصویر کجا به‌کار رفته",
    ],
  },
  orders: {
    eyebrow: "عملیات · سفارش‌ها",
    title: "دفتر کل سفارش، اسکفولدینگ.",
    body:
      "جدول سفارش‌ها و dashboardStats در Convex قبلاً داشبورد را پشتیبانی می‌کنند. محیط کاری سفارش (جستجو، فیلتر وضعیت، بازپرداخت، جدول زمانی ارسال) در تکه بعدی ارائه می‌شود.",
    icon: "Receipt",
    permission: "مدیریت سفارش‌ها",
    upNext: [
      "ویرایشگر جدول زمانی ارسال",
      "گردش کار بازپرداخت و بازگشت به موجودی",
    ],
  },
  customers: {
    eyebrow: "عملیات · مشتریان",
    title: "دفتر کل مشتری، اسکفولدینگ.",
    body:
      "کوئری customerDetail در Convex قبلاً سفارش‌ها، آدرس‌ها، تنظیمات و فعالیت را به‌هم متصل می‌کند. محیط فاز ۵.۲ این داده‌ها را با جستجو، بخش‌بندی و یادداشت‌های داخلی حساس به حسابرسی در زمینه قرار می‌دهد.",
    icon: "Customers",
    permission: "مدیریت مشتریان",
    upNext: [
      "جدول مشتری با فیلتر",
      "رشته یادداشت داخلی برای هر مشتری",
    ],
  },
  reviews: {
    eyebrow: "عملیات · بازخوردها",
    title: "صف بررسی، به‌زودی.",
    body:
      "بازخوردها از طریق طرحواره فاز ۴ ذخیره می‌شوند. صفحه بررسی فاز ۵.۲ از وضعیت «در انتظار» استفاده می‌کند و گردش کار تأیید/رد/پاسخ را ارائه می‌دهد.",
    icon: "Reviews",
    permission: "مدیریت محتوا",
    upNext: [
      "تأیید · رد · پاسخ‌گویی درون‌خطی",
      "گزارش ممیزی در کنار بازخورد",
    ],
  },
  coupons: {
    eyebrow: "محتوا · کدهای تخفیف",
    title: "مدیریت کد تخفیف، در حال تکمیل.",
    body:
      "تابع admin_catalog.upsertCoupon قبلاً ساخت/ویرایش/آرشیو را انجام می‌دهد. محیط کاری قابل مشاهده (فهرست فعال، نمودار استفاده، کپی در کلیپ‌بورد) در تکه بعدی ارائه می‌شود.",
    icon: "Coupons",
    permission: "مدیریت کدهای تخفیف",
    upNext: [
      "نمودار استفاده از کد تخفیف",
      "آرشیو خودکار پس از رسیدن به سقف استفاده",
    ],
  },
  editorial: {
    eyebrow: "محتوا · مجله",
    title: "CMS مجله، اسکفولدینگ.",
    body:
      "جدول editorials به‌طور کامل سیم‌کشی شده است؛ ویرایشگر (بدنه‌ی غنی، انتخاب تصویر جلد، زمان‌بندی انتشار) در تکه بعدی اضافه می‌شود.",
    icon: "Newspaper",
    permission: "مدیریت محتوا",
    upNext: [
      "ویرایشگر بدنه غنی با درج تصویر",
      "زمان‌بندی انتشار",
    ],
  },
  settings: {
    eyebrow: "سیستم · تنظیمات",
    title: "تنظیمات برند و عملیات، در حال تکمیل.",
    body:
      "تنظیمات، کلیدهای استایل برند و ابزارهای ارسال اعلان، پس از تثبیت دامنه داده در فاز ۵.۳ ارائه می‌شوند.",
    icon: "Settings",
    permission: "مدیریت تنظیمات",
    upNext: [
      "توکن‌های برند (پالت‌ها · تایپوگرافی)",
      "قالب‌های اعلان",
    ],
  },
};

const FALLBACK: Spec = {
  eyebrow: "ادمین · مراحل بعدی",
  title: "این تکه در فاز ۵.۲ ارائه می‌شود.",
  body:
    "مسیری به دامنه‌ای که هنوز ارائه نشده است. تکه محصولات با عمق کامل، نقطه ورود است؛ بقیه در تکه‌های بعدی اضافه می‌شود.",
  icon: "Data",
  permission: "مدیریت محصولات",
  upNext: ["", "—"],
};

export function stubHeadingClass() {
  return cn(
    "type-eyebrow text-ink-muted",
    "px-5 py-2 rounded-full hairline bg-canvas-70",
  );
}
