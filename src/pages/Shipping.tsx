import { Link } from "react-router";
import { usePageMeta } from "@/lib/seo";

export default function Shipping() {
  usePageMeta({ title: "راهنمای خرید و ارسال", description: "راهنمای خرید، ارسال و پیگیری سفارش در فروشگاه آنلاین لونا", canonical: `${window.location.origin}/shipping` });

  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <p className="type-eyebrow text-ink-muted">کمک</p>
      <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-6xl">راهنمای خرید و ارسال</h1>
      <div className="mt-12 space-y-10 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="font-display text-2xl text-ink">مراحل خرید</h2>
          <ol className="mt-3 list-inside list-decimal space-y-2">
            <li>محصول مورد نظر را انتخاب کرده و سایز و رنگ را تعیین کنید.</li>
            <li>محصول را به سبد خرید اضافه نمایید.</li>
            <li>پس از تکمیل سبد خرید، بر روی «ادامه فرایند خرید» کلیک کنید.</li>
            <li>اطلاعات تماس و آدرس ارسال را وارد کنید.</li>
            <li>روش ارسال را انتخاب کرده و پرداخت را تکمیل نمایید.</li>
          </ol>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">روش‌های ارسال</h2>
          <div className="mt-3 grid gap-4">
            <div className="glass rounded-2xl p-4">
              <p className="font-medium text-ink">ارسال عادی</p>
              <p className="mt-1">۵ تا ۸ روز کاری — رایگان برای سفارش‌های بالای ۵٬۰۰۰٬۰۰۰ تومان</p>
            </div>
            <div className="glass rounded-2xl p-4">
              <p className="font-medium text-ink">ارسال سریع</p>
              <p className="mt-1">۲ تا ۳ روز کاری — ۲۵۰٬۰۰۰ تومان</p>
            </div>
            <div className="glass rounded-2xl p-4">
              <p className="font-medium text-ink">ارسال ویژه</p>
              <p className="mt-1">روز بعد در شهرهای بزرگ — ۶۵۰٬۰۰۰ تومان</p>
            </div>
          </div>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">پیگیری سفارش</h2>
          <p className="mt-3">پس از ارسال، کد پیگیری از طریق پیامک و ایمیل برای شما ارسال می‌شود. همچنین می‌توانید از طریق حساب کاربری خود، وضعیت سفارش را مشاهده کنید.</p>
        </section>
      </div>
      <Link to="/shop" className="mt-12 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary">
        بازگشت به فروشگاه
      </Link>
    </div>
  );
}
