import { NavLink } from "react-router";
import { motion } from "framer-motion";
import { Home, ShoppingBag, Heart, Layers, User } from "lucide-react";
import { cn } from "@/lib/glass";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";

const bottomLinks = [
  { label: "خانه", to: "/", icon: Home },
  { label: "فروشگاه", to: "/shop", icon: ShoppingBag },
  { label: "کالکسیون‌ها", to: "/collections", icon: Layers },
  { label: "علاقه‌مندی", to: "/wishlist", icon: Heart, badge: "wishlist" as const },
  { label: "حساب", to: "/account", icon: User },
];

export function BottomNav() {
  const { itemCount } = useCart();
  const { ids: wishlistIds } = useWishlist();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="ناوبری پایین"
    >
      <div className="glass-strong border-t border-edge/60">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1.5">
          {bottomLinks.map((link) => {
            const Icon = link.icon;
            const badgeCount =
              link.badge === "wishlist"
                ? wishlistIds.length
                : link.to === "/shop"
                  ? itemCount
                  : 0;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "relative flex flex-col items-center gap-0.5 px-2 py-1.5 min-w-[56px] rounded-xl transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-ink-soft hover:text-ink"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon
                        className={cn(
                          "h-5 w-5 transition-all",
                          isActive ? "scale-110" : "scale-100"
                        )}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                      {badgeCount > 0 && (
                        <motion.span
                          key={`bn-${badgeCount}`}
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-medium text-primary-foreground"
                        >
                          {badgeCount}
                        </motion.span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium leading-none">
                      {link.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="bn-active"
                        className="absolute top-0.5 h-0.5 w-6 rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
