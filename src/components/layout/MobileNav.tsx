import { Link } from "react-router";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { EASE_LUXURY } from "@/lib/motion";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const links = [
  { label: "خرید", to: "/shop" },
  { label: "کالکسیون‌ها", to: "/collections" },
  { label: "مجله", to: "/press" },
  { label: "کارگاه", to: "/about" },
  { label: "حساب کاربری", to: "/account" },
  { label: "سبد خرید", to: "/cart" },
];

export function MobileNav({ open, onClose }: MobileNavProps) {
  return (
    <motion.div
      initial={false}
      animate={{
        pointerEvents: open ? "auto" : "none",
        opacity: open ? 1 : 0,
      }}
      transition={{ duration: 0.32, ease: EASE_LUXURY }}
      className="fixed inset-0 z-50 lg:hidden"
    >
      {/* Backdrop */}
      <button
        aria-label="بستن"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        tabIndex={open ? 0 : -1}
      />
      {/* Panel */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: open ? "0%" : "-100%" }}
        transition={{ duration: 0.5, ease: EASE_LUXURY }}
        className="absolute left-0 top-0 h-full w-[88%] max-w-sm glass-strong overflow-y-auto p-8"
      >
        <div className="flex items-center justify-between">
          <span className="font-display text-2xl tracking-[0.36em] text-ink">ÆON</span>
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full hairline text-ink hover:bg-white/60"
            aria-label="بستن"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="mt-12 flex flex-col gap-6">
          {links.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                onClick={onClose}
                className="font-display text-3xl text-ink transition hover:text-primary"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-16 flex flex-col gap-2 text-xs text-ink-muted">
          <span>تأسیس ۱۳۹۸</span>
          <span>New York · Florence · Kyoto</span>
        </div>
      </motion.aside>
    </motion.div>
  );
}
