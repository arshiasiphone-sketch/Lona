import { Link } from "react-router";
import { motion } from "framer-motion";
import { X, Instagram, Send, MessageCircle } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EASE_LUXURY } from "@/lib/motion";
import { LonaLogo } from "@/components/brand/LonaLogo";
import { socialHref } from "@/lib/social";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const links = [
  { label: "خرید", to: "/shop" },
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
          <LonaLogo variant="default" size={42} title="لوگوی لونا" className="h-11 w-11" />
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
          <span>تهران · اصفهان · شیراز</span>
        </div>

        {/* شبکه‌های اجتماعی */}
        {socialLinks.length > 0 && (
          <div className="mt-8 flex flex-col gap-3">
            <span className="text-xs tracking-[0.04em] text-ink-muted">شبکه‌های اجتماعی</span>
            <div className="flex flex-col gap-2">
              {socialLinks.map(({ key, label, href, Icon }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="inline-flex items-center gap-3 rounded-xl bg-white/70 px-4 py-3 text-sm text-ink transition hover:bg-white hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}
      </motion.aside>
    </motion.div>
  );
}

const SOCIAL_LINKS: {
  key: "instagram" | "telegram" | "whatsapp";
  label: string;
  Icon: typeof Instagram;
}[] = [
  { key: "instagram", label: "اینستاگرام", Icon: Instagram },
  { key: "telegram", label: "تلگرام", Icon: Send },
  { key: "whatsapp", label: "واتساپ", Icon: MessageCircle },
];

function useSocialLinks() {
  const store = useQuery(api.admin_settings.getStoreInfo, {});
  return SOCIAL_LINKS
    .map((entry) => ({
      ...entry,
      href: socialHref(store?.social?.[entry.key]),
    }))
    .filter((entry): entry is typeof entry & { href: string } => entry.href !== null);
}

const socialLinks = useSocialLinks();
