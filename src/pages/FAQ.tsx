import { Link } from "react-router";
import { usePageMeta } from "@/lib/seo";

export default function FAQ() {
  usePageMeta({ title: "سوالات متداول", description: "سوالات متداول درباره خرید، ارسال، سایز و بازگشت کالا در لونا", canonical: `${window.location.origin}/faq` });

  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <p className="type-eyebrow text-ink-muted">کمک</p>
      <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-6xl">سوالات متداول</h1>
      <div className="mt-12 space-y-10 text-sm leading-relaxed text-ink-soft">
        {[
          {
            q: "زمان ارسال سفارش چقدر است؟",
            a: "سفارش‌های تهران ۱ تا ۲ روز کاری و سایر شهرها ۳ تا ۵ روز کاری تحویل داده می‌شوند. ارسال سریع در شهرهای بزرگ ۲۴ ساعته انجام می‌شود.",
          },
          {
            q: "چگونه سایز مناسب را انتخاب کنم؟",
            a: "لطفاً به صفحهٔ راهنمای سایز در پایین هر محصول مراجعه کنید. همچنین می‌توانید با پشتیبانی ما تماس بگیرید تا در انتخاب سایز کمکتان کنند.",
          },
          {
            q: "آیا امکان بازگشت کالا وجود دارد؟",
            a: "بله، شما تا ۷ روز پس از دریافت کالا فرصت دارید محصول را در بسته‌بندی اصلی و بدون استفاده بازگردانید. هزینهٔ بازگشت بر عهده ماست. لطفاً توجه کنید که به دلایل بهداشتی، برخی محصولات قابل بازگشت نیستند.",
          },
          {
            q: "بسته‌بندی سفارش چگونه است؟",
            a: "تمام سفارش‌های لونا در بسته‌بندی محرمانه و بدون ذکر نام برند روی جعبهٔ بیرونی ارسال می‌شوند. داخل بسته با کاغذ ابریشمی و کارت بوتیک همراه است.",
          },
          {
            q: "روش‌های پرداخت چیست؟",
            a: "پرداخت از طریق درگاه امن بانکی انجام می‌شود. تمام کارت‌های عضو شتاب پذیرفته می‌شوند. اطلاعات کارت شما نزد لونا ذخیره نمی‌شود.",
          },
          {
            q: "آیا امکان خرید حضوری وجود دارد؟",
            a: "بله، بوتیک‌های لونا در تهران، اصفهان و شیراز آمادهٔ پذیرش شما هستند. برای مشاهدهٔ آدرس‌ها به صفحهٔ «درباره ما» مراجعه کنید.",
          },
        ].map((item) => (
          <section key={item.q}>
            <h2 className="font-display text-xl text-ink">{item.q}</h2>
            <p className="mt-2">{item.a}</p>
          </section>
        ))}
      </div>
      <Link to="/shop" className="mt-12 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary">
        بازگشت به فروشگاه
      </Link>
    </div>
  );
}
