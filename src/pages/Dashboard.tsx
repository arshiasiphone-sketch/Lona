import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  LogOut,
  Package,
  Plus,
  Settings,
  MapPin,
  Eye,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import {
  useProducts,
  useOrdersByUser,
  staticMockOrders,
  getProductByIdFromList,
} from "@/lib/data/catalog";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/glass";
import { EASE_LUXURY } from "@/lib/motion";
import { formatDate, formatPrice } from "@/lib/format";

const tabKeys = ["overview", "orders", "saved", "addresses", "preferences", "recent"] as const;
type TabKey = (typeof tabKeys)[number];

const tabLabels: Record<TabKey, string> = {
  overview: "نمای کلی",
  orders: "سفارش‌ها",
  saved: "علاقه‌مندی‌ها",
  addresses: "آدرس‌ها",
  preferences: "تنظیمات",
  recent: "بازدیدهای اخیر",
};

const silhouetteFor = (cat: string) => {
  switch (cat) {
    case "intimates-bras": return "bra" as const;
    case "intimates-briefs": return "brief" as const;
    case "sleepwear": return "robe" as const;
    case "homewear": return "tee" as const;
    case "bodysuits": return "bodysuit" as const;
    case "shapewear": return "bodysuit" as const;
    case "loungewear-sets": return "robe" as const;
    default: return "accessory" as const;
  }
};

const STATUS_LABEL_FA = {
  processing: "در حال پردازش",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
} as const;

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { ids: wishlistIds } = useWishlist();
  const { ids: recentIds, clear: clearRecent } = useRecentlyViewed();
  const { itemCount, clear: clearCart } = useCart();
  const navigate = useNavigate();
  const [active, setActive] = useState<TabKey>("overview");

  const liveProducts = useProducts();
  const liveOrders = useOrdersByUser();
  const orders = liveOrders ?? staticMockOrders;

  const saved = wishlistIds
    .map((id) => getProductByIdFromList(liveProducts, id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const recent = recentIds
    .map((id) => getProductByIdFromList(liveProducts, id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="mx-auto max-w-[1728px] px-6 pt-16 pb-24 lg:px-10 lg:pt-24">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="type-eyebrow text-ink-muted">حساب کاربری</p>
          <h1 className="mt-3 font-display text-5xl leading-[1.02] text-ink lg:text-7xl">
            {user?.name ? `خوش آمدید، ${user.name}.` : "خوش آمدید."}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-muted">
            سفارش‌ها، محصولات ذخیره‌شده و پروفایل شما، در یک‌جا.
          </p>
        </div>
        <button
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
          className="inline-flex items-center gap-2 rounded-full hairline px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft transition hover:bg-white/60 hover:text-ink"
        >
          <LogOut className="h-4 w-4" />
          خروج از حساب
        </button>
      </header>

      <div className="mt-12 flex flex-wrap items-center gap-1.5 border-b border-edge pb-3">
        {tabKeys.map((key) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={cn(
              "rounded-full px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition",
              active === key
                ? "bg-ink text-canvas"
                : "text-ink-soft hover:bg-white/40 hover:text-ink"
            )}
          >
            {tabLabels[key]}
          </button>
        ))}
      </div>

      <motion.div
        key={active}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_LUXURY }}
        className="mt-10"
      >
        {active === "overview" && (
          <div className="grid gap-5 md:grid-cols-4">
            <StatCard label="سفارش‌های فعال" value={orders.filter((o) => o.status === "shipped" || o.status === "processing").length.toLocaleString("fa-IR")} icon={<Package className="h-3.5 w-3.5" />} />
            <StatCard label="محصولات ذخیره‌شده" value={saved.length.toLocaleString("fa-IR")} icon={<Heart className="h-3.5 w-3.5" />} />
            <StatCard label="در سبد خرید" value={itemCount.toLocaleString("fa-IR")} icon={<Plus className="h-3.5 w-3.5" />} />
            <StatCard label="مشتری از" value="۱۴۰۳" icon={<Settings className="h-3.5 w-3.5" />} />
          </div>
        )}

        {active === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="glass rounded-3xl px-8 py-12 text-center text-sm text-ink-muted">
                هنوز سفارشی ثبت نکرده‌اید. از کالکسیون شروع کنید.
              </p>
            ) : (
              orders.map((order) => {
                const first = order.items[0];
                const product = first ? getProductByIdFromList(liveProducts, first.productId) : undefined;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE_LUXURY }}
                    className="glass rounded-2xl p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="type-eyebrow text-ink-muted">سفارش {order.number}</p>
                        <p className="mt-1 font-display text-xl text-ink">
                          {formatPrice(order.total, true)}
                        </p>
                        <p className="mt-1 text-xs text-ink-soft">
                          ثبت شد در {formatDate(order.placedAt)} ·{" "}
                          <span className="text-primary">
                            {STATUS_LABEL_FA[order.status as keyof typeof STATUS_LABEL_FA] ?? order.status}
                          </span>
                        </p>
                      </div>
                      <div className="h-24 w-20 overflow-hidden rounded-xl">
                        {product && (
                          <ProductImage
                            gradient={product.colors[0].gradient}
                            silhouette={silhouetteFor(product.category)}
                            withMark={false}
                            className="h-full w-full"
                          />
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      {order.trackingNumber && (
                        <p className="text-xs text-ink-muted">
                          کد رهگیری · {order.trackingNumber}
                        </p>
                      )}
                      <button className="ml-auto inline-flex items-center gap-2 rounded-full hairline bg-canvas/60 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-ink hover:bg-white">
                        مشاهده سفارش
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {active === "saved" && (
          saved.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center">
              <p className="font-display text-2xl text-ink">هنوز محصولی ذخیره نکرده‌اید</p>
              <p className="mt-2 text-sm text-ink-soft">
                محصولاتی که از فروشگاه نشان‌گذاری می‌کنید، در اینجا نمایش داده می‌شوند.
              </p>
              <Link
                to="/shop"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-canvas hover:bg-primary"
              >
                مشاهده کالکسیون
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {saved.map((p) => (
                <Link key={p.id} to={`/shop/${p.slug}`} className="glass rounded-2xl p-3 transition hover:bg-white/60">
                  <ProductImage
                    gradient={p.colors[0].gradient}
                    silhouette={silhouetteFor(p.category)}
                    withMark={false}
                    className="aspect-[4/5] w-full"
                  />
                  <p className="mt-3 font-display text-base text-ink">{p.name}</p>
                  <p className="mt-1 text-xs text-ink-muted">{formatPrice(p.price)}</p>
                </Link>
              ))}
            </div>
          )
        )}

        {active === "addresses" && (
          <div className="grid gap-4 lg:grid-cols-2">
            {[
              {
                label: "پیش‌فرض · تهران",
                name: "مشتری نمونه",
                line1: "خیابان ولیعصر، کوچه باغ",
                city: "تهران، ۱۴۱۶۱",
              },
              {
                label: "بوتیک · اصفهان",
                name: "مشتری نمونه",
                line1: "خیابان چهارباغ عباسی",
                city: "اصفهان، ۸۱۵۸۱",
              },
            ].map((addr) => (
              <div key={addr.label} className="glass rounded-3xl p-7">
                <p className="type-eyebrow text-ink-muted">{addr.label}</p>
                <p className="mt-3 font-display text-xl text-ink">{addr.name}</p>
                <p className="mt-2 text-sm text-ink-soft">{addr.line1}</p>
                <p className="text-sm text-ink-soft">{addr.city}</p>
                <div className="mt-6 flex items-center gap-3">
                  <button className="inline-flex items-center gap-2 rounded-full hairline bg-canvas/60 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-ink hover:bg-white">
                    ویرایش
                  </button>
                  <button className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink">
                    تنظیم به‌عنوان پیش‌فرض
                  </button>
                </div>
              </div>
            ))}
            <div className="glass rounded-3xl p-7 lg:col-span-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="type-eyebrow text-ink-muted">افزودن آدرس جدید</p>
                  <p className="mt-2 font-display text-lg text-ink">
                    برای ارسال سفارش، بازگشت و زمان‌بندی ارسال ویژه استفاده می‌شود.
                  </p>
                </div>
                <MapPin className="h-4 w-4 text-ink-muted" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="type-eyebrow text-ink-muted">کشور</span>
                  <select className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>ایران</option>
                    <option>امارات</option>
                    <option>ترکیه</option>
                  </select>
                </label>
                <label className="block">
                  <span className="type-eyebrow text-ink-muted">کد پستی</span>
                  <input className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary" placeholder="۱۴۱۶۱" dir="ltr" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="type-eyebrow text-ink-muted">آدرس</span>
                  <input className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary" placeholder="خیابان، کوچه، پلاک" />
                </label>
              </div>
              <button className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[10px] font-medium uppercase tracking-[0.18em] text-canvas hover:bg-primary">
                ذخیره آدرس
              </button>
            </div>
          </div>
        )}

        {active === "preferences" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass rounded-3xl p-7">
              <p className="type-eyebrow text-ink-muted">پروفایل</p>
              <div className="mt-5 grid gap-4">
                <label className="block">
                  <span className="type-eyebrow text-ink-muted">نام</span>
                  <input
                    defaultValue={user?.name ?? ""}
                    className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </label>
                <label className="block">
                  <span className="type-eyebrow text-ink-muted">ایمیل</span>
                  <input
                    type="email"
                    defaultValue={user?.email ?? ""}
                    className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </label>
              </div>
            </div>

            <div className="glass rounded-3xl p-7">
              <p className="type-eyebrow text-ink-muted">اعلان‌ها</p>
              <ul className="mt-5 space-y-3">
                {[
                  { label: "دریافت نامه فصلی", on: true },
                  { label: "دعوت‌نامه رویدادهای بوتیک", on: false },
                  { label: "اعلان انتشار محتوای مجله", on: true },
                  { label: "اطلاع از موجود شدن محصول ذخیره‌شده", on: true },
                ].map((row) => (
                  <li
                    key={row.label}
                    className="flex items-center justify-between rounded-2xl px-3 py-2 hairline"
                  >
                    <span className="text-sm text-ink">{row.label}</span>
                    <Switch initial={row.on} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass rounded-3xl p-7 lg:col-span-2">
              <p className="type-eyebrow text-ink-muted">تنظیمات خواندن و اندازه</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="type-eyebrow text-ink-muted">واحد پول</span>
                  <select className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>تومان</option>
                    <option>دلار</option>
                    <option>یورو</option>
                    <option>درهم</option>
                  </select>
                </label>
                <label className="block">
                  <span className="type-eyebrow text-ink-muted">زبان</span>
                  <select className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>فارسی</option>
                    <option>انگلیسی</option>
                    <option>عربی</option>
                  </select>
                </label>
                <label className="block">
                  <span className="type-eyebrow text-ink-muted">سایز لباس</span>
                  <select className="mt-2 w-full rounded-2xl bg-canvas/60 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>۳۸ (M)</option>
                    <option>۳۶ (S)</option>
                    <option>۴۰ (L)</option>
                    <option>سفارشی</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="glass rounded-3xl p-7 lg:col-span-2">
              <p className="type-eyebrow text-ink-muted">مدیریت داده‌های بوتیک</p>
              <p className="mt-3 text-sm text-ink-soft">
                در هر زمان می‌توانید سبد خرید و تاریخچه بازدید را پاک کنید.
                محصولات ذخیره‌شده تا ۹۰ روز در دسترس هستند.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    clearCart();
                  }}
                  className="rounded-full hairline bg-canvas/60 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft hover:bg-white"
                >
                  پاک کردن سبد خرید
                </button>
                <button
                  onClick={clearRecent}
                  className="rounded-full hairline bg-canvas/60 px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft hover:bg-white"
                >
                  پاک کردن بازدیدهای اخیر
                </button>
              </div>
            </div>
          </div>
        )}

        {active === "recent" && (
          recent.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center">
              <Eye className="mx-auto h-5 w-5 text-ink-soft" />
              <p className="mt-4 font-display text-2xl text-ink">بازدید اخیر ثبت نشده.</p>
              <p className="mt-2 text-sm text-ink-soft">
                محصولاتی که مرور می‌کنید، در اینجا نمایش داده می‌شوند. حداکثر ۲۰ محصول ذخیره می‌شود.
              </p>
              <Link
                to="/shop"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-canvas hover:bg-primary"
              >
                شروع به بازدید
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                {recent.slice(0, 16).map((p) => (
                  <Link key={p.id} to={`/shop/${p.slug}`} className="glass rounded-2xl p-3 transition hover:bg-white/60">
                    <ProductImage
                      gradient={p.colors[0].gradient}
                      silhouette={silhouetteFor(p.category)}
                      withMark={false}
                      className="aspect-[4/5] w-full"
                    />
                    <p className="mt-3 font-display text-base text-ink">{p.name}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                      {formatPrice(p.price)}
                    </p>
                  </Link>
                ))}
              </div>
              {recent.length > 0 && (
                <div className="mt-10 text-right">
                  <button
                    onClick={clearRecent}
                    className="text-[11px] uppercase tracking-[0.18em] text-ink-muted hover:text-ink"
                  >
                    پاک کردن تاریخچه
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </motion.div>

      <div className="sr-only">
        <p>Account workspace skeleton</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_LUXURY }}
      className="glass-strong rounded-3xl p-7"
    >
      <div className="flex items-center gap-2 text-ink-muted">
        <span className="grid h-7 w-7 place-items-center rounded-full hairline bg-white/50">
          {icon}
        </span>
        <p className="type-eyebrow">{label}</p>
      </div>
      <p className="mt-4 font-display text-4xl text-ink lg:text-5xl">{value}</p>
    </motion.div>
  );
}

function Switch({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => setOn((v) => !v)}
      className={cn(
        "relative grid h-6 w-11 place-items-start rounded-full p-1 transition",
        on ? "bg-primary" : "bg-edge"
      )}
    >
      <span
        className={cn(
          "h-4 w-4 rounded-full bg-canvas transition-transform duration-300",
          on && "-translate-x-5"
        )}
      />
    </button>
  );
}
