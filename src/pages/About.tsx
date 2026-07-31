import { Link } from "react-router";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { EditorialStory } from "@/components/editorial/EditorialStory";
import { EASE_LUXURY } from "@/lib/motion";
import { usePageMeta } from "@/lib/seo";
import { EditorialImage } from "@/components/ui/EditorialImage";
import { LONA_MOCK_IMAGES } from "@/data/mock-images";

const stores = [
  {
    city: "تهران",
    address: "خیابان ولیعصر، پلاک ۲۵۶۸، طبقهٔ همکف",
    hours: "شنبه تا چهارشنبه · ۱۰:۰۰ تا ۲۱:۰۰",
  },
  {
    city: "اصفهان",
    address: "چهارباغ عباسی، کوچهٔ جهان‌نما، پلاک ۱۲",
    hours: "شنبه تا پنجشنبه · ۱۱:۰۰ تا ۲۲:۰۰",
  },
  {
    city: "شیراز",
    address: "خیابان زند، پلاک ۴۲، بوستان سعادت",
    hours: "یکشنبه تا جمعه · ۱۰:۳۰ تا ۲۰:۳۰",
  },
];

export default function About() {
  usePageMeta({
    title: "درباره لونا — بوتیک لباس زیر زنانه",
    description: "لونا در سال ۱۳۹۸ در تهران آغاز شد. بوتیک آنلاین لباس زیر زنانه لوکس با تمرکز بر کیفیت پارچه، طراحی ظریف و راحتی روزمره.",
    canonical: `${window.location.origin}/about`,
    ogType: "website",
  });
  return (
    <div className="mx-auto max-w-[1728px] px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <header className="max-w-4xl">
        <p className="type-eyebrow text-ink-muted">کارگاه لونا</p>
        <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-9xl">
          خانه‌ای برای آرامش، ماندگاری و ظرافت بی‌صدا.
        </h1>
        <p className="mt-8 text-base leading-relaxed text-ink-soft lg:text-lg">
          لونا در سال ۱۳۹۸ در تهران با جمعی کوچک از طراحان پارچه، خیاطان و
          مشتریان آگاه آغاز شد. این خانه به تولید محصولاتی ماندگار اختصاص
          دارد — لباس‌های زیر با برش‌های سنجیده، پارچه‌های نرم و لطیف، و
          جزئیاتی که هر روز حس خوبی به همراه دارند.
        </p>
      </header>

      <Reveal as="section" className="mt-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: EASE_LUXURY }}
          className="grid gap-12 lg:grid-cols-2"
        >
          <EditorialImage
            src={LONA_MOCK_IMAGES.editorialFashion}
            alt="تصویر کارگاه تهران لونا"
            className="gradient-rose aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-inset ring-white/45"
            imgClassName="opacity-90"
          >
            <div className="grid h-full place-items-center text-ink/55">
              <p className="font-display text-3xl">کارگاه تهران</p>
            </div>
          </EditorialImage>
          <div className="grid gap-6 self-center">
            <p className="type-eyebrow text-ink-muted">دوخته‌شده با دست</p>
            <h2 className="font-display text-3xl leading-[1.05] text-ink lg:text-4xl">
              هر قطعه به دست یک نفر تمام می‌شود؛ نام او بر برچسب درج شده است.
            </h2>
            <p className="text-sm leading-relaxed text-ink-soft">
              لونا به تولید انبوه باور ندارد. هر لباس دست‌کم از دوازده جفت
              دست عبور می‌کند — از برش‌زن تا دوخت آخر. برچسبی درون هر لباس،
              نام سازندگانی را که آن را در دست گرفته‌اند، با افتخار روایت
              می‌کند.
            </p>
          </div>
        </motion.div>
      </Reveal>

      <EditorialStory
        eyebrow="پارچه و مواد"
        quote="ما با دوازده کارخانهٔ پارچه، چهار کارگاه گلدوزی و یک واحد بسته‌بندی در تهران همکاری می‌کنیم. سال‌هاست که با آن‌ها کار می‌کنیم و هرگز برای قمت تأمین‌کننده را تغییر نمی‌دهیم."
        body=""
        attribution="بنیان‌گذار لونا"
      />

      {/* Sustainability */}
      <section id="sustainability" className="mt-32">
        <p className="type-eyebrow text-ink-muted">پایداری</p>
        <h2 className="mt-3 font-display text-4xl leading-[1.05] text-ink lg:text-6xl">
          کند، به انتخاب خودمان.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { stat: "۱۰۰٪", label: "الیاف طبیعی در سری ماندگار لونا." },
            { stat: "≤ ۴ گرم", label: "میانگین کربن برای هر تکه، ممیزی سالانه." },
            { stat: "همیشه", label: "تعمیر، نه تعویض — بازگشت به کارگاه سازنده." },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, ease: EASE_LUXURY, delay: i * 0.08 }}
              className="glass rounded-3xl p-8"
            >
              <p className="font-display text-5xl text-ink">{item.stat}</p>
              <p className="mt-4 text-sm text-ink-muted">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stores */}
      <section id="stores" className="mt-32">
        <p className="type-eyebrow text-ink-muted">بوتیک‌ها</p>
        <h2 className="mt-3 font-display text-4xl leading-[1.05] text-ink lg:text-6xl">
          سه فضا.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft lg:text-base">
          بوتیک‌های لونا فضاهایی آرام برای تجربهٔ حضوری لباس‌ها هستند؛ جایی
          برای لمس پارچه، امتحان سایز و گفت‌وگو با مشاوران ما.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {stores.map((s) => (
            <div key={s.city} className="glass rounded-3xl p-8">
              <p className="type-eyebrow text-ink-muted">{s.city}</p>
              <p className="mt-3 font-display text-2xl leading-[1.25] text-ink">
                {s.address}
              </p>
              <p className="mt-3 text-sm text-ink-muted">{s.hours}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mt-32">
        <div className="glass-strong overflow-hidden rounded-3xl">
          <div className="grid gap-10 p-10 lg:grid-cols-[1fr_1.4fr] lg:p-16">
            <div>
              <p className="type-eyebrow text-ink-muted">مشاور شخصی</p>
              <h2 className="mt-3 font-display text-3xl leading-[1.05] text-ink lg:text-4xl">
                به کارگاه بنویسید.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                برای اندازه‌گیری، تعمیر، سفارش‌های ویژه یا هر پرسش آرام دیگر.
                پاسخ ما در کمتر از ۲۴ ساعت به دست شما می‌رسد.
              </p>
            </div>
            <ul className="divide-y divide-edge/60">
              <li className="flex items-center gap-3 py-4 text-sm">
                <Mail className="h-4 w-4 text-ink-muted" />
                <span dir="ltr" className="text-ink">
                  concierge@lona.studio
                </span>
              </li>
              <li className="flex items-center gap-3 py-4 text-sm">
                <Phone className="h-4 w-4 text-ink-muted" />
                <span dir="ltr" className="text-ink">
                  +98 ۲۱ ۸۸۲۳ ۴۵۶۷
                </span>
              </li>
              <li className="flex items-start gap-3 py-4 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 text-ink-muted" />
                <span className="text-ink-soft">
                  خیابان ولیعصر، پلاک ۲۵۶۸، تهران، ایران
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex items-center justify-between text-sm text-ink-muted">
          <Link to="/shop" className="hover:text-ink">
            مشاهدهٔ کالکسیون ←
          </Link>
          <Link to="/press" className="hover:text-ink">
            مطالعهٔ مجله ←
          </Link>
        </div>
      </section>
    </div>
  );
}
