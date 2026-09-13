import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Clock,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePageMeta } from "@/lib/seo";
import { cn } from "@/lib/glass";

type FormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const initialForm: FormState = { name: "", email: "", phone: "", subject: "", message: "" };

export default function Contact() {
  usePageMeta({
    title: "تماس با ما",
    description: "راه‌های ارتباط با بوتیک لونا برای مشاوره خرید، پیگیری سفارش و پشتیبانی.",
    canonical: typeof window === "undefined" ? undefined : `${window.location.origin}/contact`,
  });
  const store = useQuery(api.admin_settings.getStoreInfo, {});
  const submitMessage = useMutation(api.admin_settings.submitContactMessage);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const socials = (store?.social ?? {}) as Record<string, string>;
  const mapUrl = useMemo(
    () => store?.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}` : "https://www.google.com/maps",
    [store?.address],
  );

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitError(null);
  };

  const validate = () => {
    const next: typeof errors = {};
    if (form.name.trim().length < 2) next.name = "نام خود را وارد کنید.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "ایمیل معتبر وارد کنید.";
    if (form.phone && !/^[+\d\s().-]{7,25}$/.test(form.phone.trim())) next.phone = "شماره تماس را بررسی کنید.";
    if (form.subject.trim().length < 2) next.subject = "موضوع پیام را انتخاب کنید.";
    if (form.message.trim().length < 10) next.message = "متن پیام باید حداقل ۱۰ کاراکتر باشد.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitMessage({ ...form, phone: form.phone.trim() || undefined });
      setForm(initialForm);
      setSent(true);
    } catch (error) {
      const code = (error as Error).message;
      setSubmitError(code.includes("CONTACT_") ? "اطلاعات فرم را بررسی کنید و دوباره تلاش کنید." : "ارسال پیام انجام نشد؛ لطفاً دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-16 lg:px-10 lg:pt-24" dir="rtl">
      <p className="type-eyebrow text-ink-muted">ارتباط با لونا</p>
      <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-6xl">در کنار شماییم.</h1>
      <p className="mt-5 max-w-xl text-sm leading-8 text-ink-soft">برای مشاوره خرید، پیگیری سفارش یا هر پرسش دیگری، تیم پشتیبانی لونا در ساعات پاسخ‌گویی همراه شماست.</p>

      <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.2fr]">
        <div className="space-y-4">
          <ContactCard icon={Phone} label="تلفن ثابت" value={store?.landlinePhone || store?.phone} href={store?.landlinePhone || store?.phone ? `tel:${(store.landlinePhone || store.phone).replace(/\s+/g, "")}` : undefined} />
          <ContactCard icon={Phone} label="تلفن همراه" value={store?.mobilePhone} href={store?.mobilePhone ? `tel:${store.mobilePhone.replace(/\s+/g, "")}` : undefined} />
          <ContactCard icon={Mail} label="ایمیل رسمی" value={store?.email} href={store?.email ? `mailto:${store.email}` : undefined} />
          <ContactCard icon={MapPin} label="نشانی" value={store?.address} />
          <ContactCard icon={Clock} label="ساعات پاسخ‌گویی" value={store?.hours} />
          {store?.postalCode ? <div className="glass rounded-3xl p-5 text-sm text-ink-soft">کد پستی: <span dir="ltr" className="text-ink">{store.postalCode}</span></div> : null}

          <a href={mapUrl} target="_blank" rel="noreferrer" className="glass group block overflow-hidden rounded-3xl p-5 transition hover:bg-white/70">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-ink"><MapPin className="h-4 w-4 text-primary" /> مسیر دسترسی</span>
              <ArrowLeft className="h-4 w-4 text-ink-muted transition group-hover:-translate-x-1" />
            </div>
            <div className="mt-4 grid h-24 place-items-center rounded-2xl border border-dashed border-edge bg-canvas-soft text-center text-xs leading-6 text-ink-muted">
              <span>مشاهدهٔ نشانی در نقشهٔ گوگل<br />{store?.address || "نشانی فروشگاه پس از ثبت در تنظیمات نمایش داده می‌شود"}</span>
            </div>
          </a>

          <div className="flex items-center gap-3 rounded-3xl border border-edge/70 bg-white/50 p-5">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-edge text-ink-soft"><ShieldCheck className="h-4 w-4" /></span>
            <div><p className="type-eyebrow text-ink-muted">اعتماد و اصالت</p><p className="mt-1 text-xs leading-6 text-ink-soft">بسته‌بندی محرمانه، پرداخت امن و پشتیبانی پاسخ‌گو.</p></div>
          </div>
        </div>

        <div className="glass-strong rounded-3xl p-6 sm:p-8">
          <p className="type-eyebrow text-ink-muted">فرم تماس</p>
          <h2 className="mt-2 font-display text-2xl text-ink">برای ما بنویسید</h2>
          {sent ? (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-7 text-emerald-800" role="status">
              پیام شما با موفقیت ثبت شد. تیم پشتیبانی در اولین فرصت با شما تماس می‌گیرد.
              <button type="button" onClick={() => setSent(false)} className="mt-4 block text-xs font-medium text-emerald-900 underline">ارسال پیام جدید</button>
            </div>
          ) : (
            <form className="mt-6 grid gap-4" onSubmit={submit} noValidate>
              <FormField label="نام و نام خانوادگی" value={form.name} onChange={(value) => update("name", value)} error={errors.name} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="ایمیل" type="email" dir="ltr" value={form.email} onChange={(value) => update("email", value)} error={errors.email} />
                <FormField label="شماره تماس (اختیاری)" type="tel" dir="ltr" value={form.phone} onChange={(value) => update("phone", value)} error={errors.phone} />
              </div>
              <FormField label="موضوع پیام" value={form.subject} onChange={(value) => update("subject", value)} error={errors.subject} placeholder="مثلاً پیگیری سفارش یا مشاوره سایز" />
              <FormField label="متن پیام" value={form.message} onChange={(value) => update("message", value)} error={errors.message} multiline />
              {submitError ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-xs leading-6 text-rose-700" role="alert">{submitError}</p> : null}
              <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[11px] font-medium tracking-[0.12em] text-canvas transition hover:bg-primary disabled:opacity-50">
                {submitting ? "در حال ارسال…" : <><Send className="h-3.5 w-3.5" /> ارسال پیام</>}
              </button>
              <p className="text-xs leading-6 text-ink-soft">اطلاعات شما فقط برای پاسخ‌گویی به همین درخواست استفاده می‌شود. برای جزئیات، <Link to="/privacy" className="text-ink underline">حریم خصوصی</Link> را بخوانید.</p>
            </form>
          )}

          {Object.values(socials).some(Boolean) ? (
            <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-edge/70 pt-6">
              <span className="type-eyebrow text-ink-muted">شبکه‌های اجتماعی</span>
              {Object.entries(socials).filter(([, value]) => value).map(([key, value]) => {
                const Icon = key === "telegram" ? Send : key === "whatsapp" ? MessageCircle : Instagram;
                return (
                  <a
                    key={key}
                    href={value.startsWith("http") ? value : `https://${value}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full hairline px-3 py-2 text-xs text-ink-soft transition hover:bg-white hover:text-ink"
                    aria-label={key}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {key === "instagram" ? "اینستاگرام" : key === "telegram" ? "تلگرام" : "واتساپ"}
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <Link to="/shop" className="mt-14 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-medium tracking-[0.12em] text-canvas hover:bg-primary"><ArrowLeft className="h-3.5 w-3.5" /> بازگشت به فروشگاه</Link>
    </div>
  );
}

function ContactCard({ icon: Icon, label, value, href }: { icon: typeof Phone; label: string; value?: string; href?: string }) {
  if (!value) return null;
  const content = <><span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-canvas"><Icon className="h-4 w-4" /></span><div><p className="type-eyebrow text-ink-muted">{label}</p><p className="mt-1 text-sm text-ink" dir={href?.startsWith("tel:") || href?.startsWith("mailto:") ? "ltr" : undefined}>{value}</p></div></>;
  return href ? <a href={href} className="glass flex items-center gap-4 rounded-3xl p-5 transition hover:bg-white/70">{content}</a> : <div className="glass flex items-center gap-4 rounded-3xl p-5">{content}</div>;
}

function FormField({ label, value, onChange, error, type = "text", dir = "rtl", placeholder, multiline = false }: { label: string; value: string; onChange: (value: string) => void; error?: string; type?: string; dir?: "rtl" | "ltr"; placeholder?: string; multiline?: boolean }) {
  const className = cn("mt-2 w-full rounded-2xl border bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none", error ? "border-rose-400" : "border-edge");
  return <label className="block"><span className="text-xs text-ink-soft">{label}</span>{multiline ? <textarea dir={dir} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={5} aria-invalid={Boolean(error)} className={cn(className, "resize-y")} /> : <input dir={dir} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} aria-invalid={Boolean(error)} className={className} />}{error ? <span className="mt-1 block text-xs text-rose-700">{error}</span> : null}</label>;
}
