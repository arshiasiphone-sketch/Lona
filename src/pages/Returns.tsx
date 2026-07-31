import { Link } from "react-router";
import { usePageMeta } from "@/lib/seo";

export default function Returns() {
  usePageMeta({ title: "شرایط بازگشت کالا", description: "شرایط و مراحل بازگشت و تعویض کالا در فروشگاه آنلاین لونا", canonical: `${window.location.origin}/returns` });

  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <p className="type-eyebrow text-ink-muted">کمک</p>
      <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-6xl">شرایط بازگشت کالا</h1>
      <div className="mt-12 space-y-10 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="font-display text-2xl text-ink">شرایط بازگشت</h2>
          <p className="mt-3">شما می‌توانید محصول را تا ۷ روز پس از دریافت، در صورت عدم استفاده و در بسته‌بندی اصلی بازگردانید. هزینهٔ ارسال بازگشت بر عهدهٔ لوناست.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">موارد استثنا</h2>
          <p className="mt-3">به دلایل بهداشتی، محصولات زیر قابل بازگشت نیستند: شورت، بادی، و محصولاتی که بسته‌بندی اصلی آن‌ها باز شده باشد. همچنین محصولات حراج و سفارش‌های ویژه قابل بازگشت نیستند.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">مراحل بازگشت</h2>
          <ol className="mt-3 list-inside list-decimal space-y-2">
            <li>با پشتیبانی ما تماس بگیرید یا از طریق حساب کاربری درخواست بازگشت ثبت کنید.</li>
            <li>کد بازگشت دریافت کرده و محصول را در بسته‌بندی اصلی آماده کنید.</li>
            <li>پیک لونا در زمان هماهنگ‌شده برای تحویل مراجعه می‌کند.</li>
            <li>پس از بررسی سلامت کالا در کارگاه، بازپرداخت ظرف ۷۲ ساعت انجام می‌شود.</li>
          </ol>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">تعویض</h2>
          <p className="mt-3">تعویض سایز یا رنگ در صورت موجودی امکان‌پذیر است و هزینهٔ ارسال رفت‌وبرگشت رایگان می‌باشد.</p>
        </section>
      </div>
      <Link to="/shop" className="mt-12 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary">
        بازگشت به فروشگاه
      </Link>
    </div>
  );
}
