import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { EASE_LUXURY } from "@/lib/motion";

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -right-40 top-12 h-[640px] w-[640px] rounded-full bg-accent/40 blur-[140px]" />
      <div className="pointer-events-none absolute -left-40 bottom-10 h-[640px] w-[640px] rounded-full bg-rose-quartz/30 blur-[140px] opacity-50" />
      <div className="relative mx-auto flex min-h-screen max-w-[1728px] flex-col items-center justify-center px-6 text-center lg:px-10">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: EASE_LUXURY }}
          className="font-display text-[20vw] font-light leading-none tracking-[-0.04em] text-ink lg:text-[14vw]"
        >
          ۴۰۴
        </motion.span>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_LUXURY, delay: 0.2 }}
          className="mt-6 font-display text-2xl text-ink lg:text-4xl"
        >
          این صفحه دیگر در دسترس نیست.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_LUXURY, delay: 0.34 }}
          className="mt-4 max-w-md text-sm leading-relaxed text-ink-muted"
        >
          احتمالاً آدرس را اشتباه وارد کرده‌اید یا این محصول از کالکسیون خارج
          شده است. می‌توانید به صفحه اصلی بازگردید یا کالکسیون‌های تازه را مرور
          کنید.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_LUXURY, delay: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary"
          >
            <ArrowRight className="h-4 w-4" />
            بازگشت به خانه
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 rounded-full glass-subtle px-6 py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink hover:bg-white/60"
          >
            مشاهده کالکسیون
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
