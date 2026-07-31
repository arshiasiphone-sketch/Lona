import { Link } from "react-router";
import { usePageMeta } from "@/lib/seo";

export default function Terms() {
  usePageMeta({ title: "قوانین و مقررات", description: "قوانین و مقررات استفاده از فروشگاه آنلاین لونا", noindex: true });

  return (
    <div className="mx-auto max-w-3xl px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <p className="type-eyebrow text-ink-muted">حقوقی</p>
      <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-6xl">قوانین و مقررات</h1>
      <div className="mt-12 space-y-10 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="font-display text-2xl text-ink">۱. پذیرش شرایط</h2>
          <p className="mt-3">استفاده از وب‌سایت لونا و خرید محصولات از آن به‌منزلهٔ پذیرش کامل قوانین و مقررات ذکر شده در این صفحه است. لونا حق دارد در هر زمان این قوانین را به‌روزرسانی کند و ادامهٔ استفاده شما به‌معنای پذیرش تغییرات خواهد بود.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">۲. ثبت‌نام و حساب کاربری</h2>
          <p className="mt-3">اطلاعات ثبت‌نام شما باید صحیح و کامل باشد. شما مسئول حفظ امنیت حساب کاربری و رمز عبور خود هستید. هرگونه فعالیت از طریق حساب شما بر عهده شماست.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">۳. سفارش و تأیید</h2>
          <p className="mt-3">پس از ثبت سفارش، تأییدیه‌ای از طریق ایمیل برای شما ارسال می‌شود. این تأییدیه به‌معنای پذیرش نهایی سفارش نیست و لونا حق دارد سفارش را در صورت موجود نبودن کالا یا مغایرت قیمت لغو کند.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">۴. قیمت‌گذاری</h2>
          <p className="mt-3">تمامی قیمت‌ها به تومان ایران درج شده و شامل مالیات بر ارزش افزوده می‌باشد. لونا حق تغییر قیمت‌ها را بدون اطلاع قبلی دارد، اما سفارش‌های ثبت‌شده با قیمت زمان ثبت محاسبه می‌شوند.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">۵. مالکیت معنوی</h2>
          <p className="mt-3">تمامی محتوا، تصاویر، طرح‌ها و نام تجاری لونا متعلق به این برند است و هرگونه استفاده بدون مجوز کتبی ممنوع است.</p>
        </section>
      </div>
      <Link to="/shop" className="mt-12 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary">
        بازگشت به فروشگاه
      </Link>
    </div>
  );
}
