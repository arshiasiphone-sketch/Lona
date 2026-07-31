import { Link } from "react-router";
import { usePageMeta } from "@/lib/seo";

export default function Privacy() {
  usePageMeta({ title: "حریم خصوصی", description: "سیاست حفظ حریم خصوصی فروشگاه آنلاین لونا", noindex: true });

  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <p className="type-eyebrow text-ink-muted">حقوقی</p>
      <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-6xl">حریم خصوصی</h1>
      <div className="mt-12 space-y-10 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="font-display text-2xl text-ink">۱. اطلاعاتی که جمع‌آوری می‌کنیم</h2>
          <p className="mt-3">لونا اطلاعات شخصی شما از جمله نام، ایمیل، شماره تماس و آدرس را تنها برای پردازش سفارش، ارسال محصول و ارائهٔ خدمات پشتیبانی جمع‌آوری می‌کند.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">۲. استفاده از اطلاعات</h2>
          <p className="mt-3">اطلاعات شما صرفاً برای تکمیل سفارش، ارتباط با شما در خصوص سفارش و بهبود تجربهٔ خرید استفاده می‌شود. لونا هرگز اطلاعات شما را به شخص ثالث نمی‌فروشد.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">۳. امنیت</h2>
          <p className="mt-3">لونا از پروتکل‌های رمزنگاری استاندارد برای حفاظت از اطلاعات شما در هنگام انتقال استفاده می‌کند. همچنین دسترسی به پایگاه داده تنها برای کارکنان مجاز امکان‌پذیر است.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">۴. کوکی‌ها</h2>
          <p className="mt-3">لونا از کوکی‌ها برای ذخیرهٔ سبد خرید، اولویت‌های کاربر و تحلیل عملکرد وب‌سایت استفاده می‌کند. شما می‌توانید کوکی‌ها را از طریق مرورگر خود غیرفعال کنید.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">۵. حقوق شما</h2>
          <p className="mt-3">شما حق دارید اطلاعات شخصی خود را مشاهده، اصلاح یا حذف کنید. برای درخواست حذف حساب کاربری با پشتیبانی لونا تماس بگیرید.</p>
        </section>
      </div>
      <Link to="/shop" className="mt-12 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary">
        بازگشت به فروشگاه
      </Link>
    </div>
  );
}
