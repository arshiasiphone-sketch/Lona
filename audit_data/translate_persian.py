#!/usr/bin/env python3
"""Phase 5.9 — line-anchored Persian translation pass for LONA.

For each entry in /tmp/audit_refined.json, locate the English string on
the specified line and replace it in place with the Persian equivalent
from the master translation table. The table is exhaustive for the 189
unique strings detected by the refined scanner. Unmatched strings are
reported to stderr so the audit can be re-run.
"""
import json, pathlib, sys

audit = json.load(open("/tmp/audit_refined.json"))

T = {
    # ---- About.tsx ----
    "A house for the slow, the durable, the quietly distinguished.": "خانه‌ای برای آهستگی، دوام و وقار بی‌صدا.",
    "The Florence Atelier": "کارگاه فلورانس",
    "Made by Hand": "ساخته‌شده با دست",
    "Each piece is finished by a single maker. The label inside is their name.": "هر تکه توسط تنها یک هنرمند به پایان می‌رسد. برچسب داخلی، نام همان هنرمند است.",
    "Sustainability": "پایداری",
    "Slow, by design.": "کند، به‌عمد.",
    "Stores": "بوتیک‌ها",
    "Three rooms.": "سه فضای صمیمی.",
    "Personal Concierge": "مشاور شخصی",
    "Write to the atelier.": "با کارگاه گفت‌وگو کنید.",
    "For fittings, repairs, custom orders or quiet questions. Replies arrive within 24 hours.": "برای اندازه‌گیری، تعمیر، سفارش‌های ویژه یا پرسش‌های آرام. پاسخ در کمتر از ۲۴ ساعت.",
    "concierge@aeon.studio": "concierge@lona.studio",
    "Via dei Giardini 14, 20121 Milano, IT": "Via dei Giardini 14, 20121 Milano, IT",
    "Natural fiber base across the Permanent collection.": "پایه‌ی الیاف طبیعی در سری ماندگار لونا.",
    "Average CO₂ per garment, audited annually.": "میانگین کربن برای هر تکه، ممیزی سالانه.",
    "Repair, not replace — sent back to the original atelier.": "تعمیر، نه تعویض — بازگشت به کارگاه سازنده.",
    # ---- Auth.tsx ----
    "name@example.com": "name@example.com",
    # ---- Checkout.tsx ----
    "MM/YY": "ماه/سال",
    # ---- Collection.tsx ----
    "Collection not found.": "کالکسیون یافت نشد.",
    "All Collections": "همهٔ کالکسیون‌ها",
    "Collections": "کالکسیون‌ها",
    "Refined twice yearly": "دو بار در سال بازنگری‌شده",
    # ---- Collections.tsx ----
    "The House": "خانهٔ لونا",
    "Enter Collection": "ورود به کالکسیون",
    # ---- Dashboard.tsx ----
    "Account workspace skeleton": "چارچوب فضای کاربری حساب",
    # ---- Press.tsx ----
    "The Journal": "مجلهٔ لونا",
    "Long form from the house.": "روایت‌های بلند از خانهٔ لونا.",
    "Read": "خواندن",
    "More to come.": "داستان‌های بیشتر در راه است.",
    "Subscribe to the seasonal letter at the foot of any page.": "برای عضویت در خبرنامهٔ فصلی، به پایین هر صفحه مراجعه کنید.",
    # ---- ProductList.tsx ----
    "Publish": "انتشار",
    "Featured": "ویژه",
    "Trending": "پرطرفدار",
    "Editorial": "ادیتوریال",
    "Catalogue": "کاتالوگ",
    "new product": "محصول جدید",
    "New product": "محصول تازه",
    "Begin a draft": "شروع پیش‌نویس",
    "Promise": "تعهد لونا",
    "Duplicate": "کپی",
    "Restore": "بازنشانی",
    "Publish directly from the list": "انتشار مستقیم از فهرست",
    # ---- ProductWizard.tsx ----
    "Product not found.": "محصول یافت نشد.",
    "Back to catalogue": "بازگشت به کاتالوگ",
    "Back": "بازگشت",
    "Continue": "ادامه",
    "View on storefront": "مشاهده در فروشگاه",
    "Step 1 / 8": "مرحلهٔ ۱ از ۸",
    "Basic information": "اطلاعات پایه",
    "Step 2 / 8": "مرحلهٔ ۲ از ۸",
    "Media library": "کتابخانهٔ رسانه",
    "Step 3 / 8": "مرحلهٔ ۳ از ۸",
    "Step 4 / 8": "مرحلهٔ ۴ از ۸",
    "Step 5 / 8": "مرحلهٔ ۵ از ۸",
    "Step 6 / 8": "مرحلهٔ ۶ از ۸",
    "Pricing & inventory": "قیمت‌گذاری و موجودی",
    "Inventory:": "موجودی:",
    "Step 7 / 8": "مرحلهٔ ۷ از ۸",
    "SEO": "سئو",
    "Step 8 / 8": "مرحلهٔ ۸ از ۸",
    "Publishing": "انتشار نهایی",
    "Restore as draft": "بازنشانی به پیش‌نویس",
    "autumn-winter, essentials, evening, objects…": "پاییز-زمستان، ضروریات، شب، اکسسوری…",
    "100% Italian merino wool…": "۱۰۰٪ مرینو ایتالیایی…",
    "Cut and sewn in Florence.": "برش و دوخت در فلورانس.",
    "Basic Info": "اطلاعات پایه",
    "Media": "رسانه",
    "Pricing & Inventory": "قیمت و موجودی",
    "Untitled piece": "تکهٔ بدون نام",
    "Editorial pick": "انتخاب ادیتوریال",
    "Save & continue": "ذخیره و ادامه",
    # ---- Admin MediaUploader ----
    "Drop a piece's photography here.": "تصاویر تکه را در اینجا رها کنید.",
    "Browse from device": "انتخاب از دستگاه",
    "done": "انجام شد",
    "Attached.": "پیوست شد.",
    "No preview": "بدون پیش‌نمایش",
    "Primary": "اصلی",
    "Dismiss": "بستن",
    # ---- Admin VariantEditor ----
    "Reset": "بازنشانی",
    "Save variants": "ذخیرهٔ تنوع‌ها",
    "Pick at least one colour and one size in": "حداقل یک رنگ و یک سایز انتخاب کنید",
    "optional": "اختیاری",
    # ---- Admin index, LogoDropdown, LonaLogo ----
    "LONA": "لونا",
    "Landing Page": "صفحهٔ اصلی",
    "Sign Out": "خروج از حساب",
    "activity_logs": "لاگ فعالیت",
    # ---- EmptyStates ----
    "Bag": "کیف",
    "Quiet, for now.": "برای لحظاتی، ساکت.",
    "Your bag is currently empty. Begin with the season's newly considered pieces.": "سبد خرید شما خالی است. با تکه‌های تازهٔ فصل شروع کنید.",
    "View Catalogue": "مشاهدهٔ کاتالوگ",
    "Nothing saved yet.": "هنوز چیزی ذخیره نشده است.",
    "Heart a piece to keep it here. Wishlist items persist for ninety days.": "برای نگه‌داشتن یک تکه، قلب آن را بزنید. علاقه‌مندی‌ها برای نود روز باقی می‌مانند.",
    "Browse Catalogue": "مرور کاتالوگ",
    "No placements yet.": "هنوز جای‌گذاری‌ای انجام نشده است.",
    "No pieces match the current selection.": "هیچ تکه‌ای با انتخاب فعلی هم‌خوانی ندارد.",
    "Reset filters": "بازنشانی فیلترها",
    "Begin a piece": "شروع یک تکه",
    # ---- shipping estimator ----
    "Shipping estimate": "برآورد ارسال",
    "Enter your country and postal code for delivery windows and prices.": "کشور و کد پستی خود را وارد کنید تا بازه‌های ارسال و قیمت نمایش داده شود.",
    "Postal / ZIP code": "کد پستی",
    "Estimate": "برآورد",
    # ---- pagination ----
    "Active": "فعال",
    "Previous": "قبلی",
    "Next": "بعدی",
    "Go to page": "رفتن به صفحه",
    "Page": "صفحه",
    # ---- Banner strings ----
    "Lingerie, slowly considered.": "لباس زیر، با تأملی آرام.",
    "Subtotal": "جمع جزء",
    "Share": "اشتراک‌گذاری",
    "Continue shopping": "ادامهٔ خرید",
    "Start shopping": "شروع خرید",
    "Trending now": "پرطرفدار این روزها",
    "New this season": "تازهٔ این فصل",
    "Best sellers": "پرفروش‌ها",
    "Curated for you": "انتخاب برای شما",
    "View product": "مشاهدهٔ محصول",
    "View all": "مشاهدهٔ همه",
    "Quick view": "نمایش سریع",
    "Add to wishlist": "افزودن به علاقه‌مندی‌ها",
    "Remove from wishlist": "حذف از علاقه‌مندی‌ها",
    "Add to bag": "افزودن به سبد خرید",
    "Sold out": "ناموجود",
    "In stock": "موجود",
    "Limited edition": "تولید محدود",
    "Colour": "رنگ",
    "Color": "رنگ",
    "Size": "سایز",
    "Quantity": "تعداد",
    "SKU": "کد محصول",
    "Stock": "موجودی",
    "Available": "موجود",
    "Manage": "مدیریت",
    "Add": "افزودن",
    "Remove": "حذف",
    "Save": "ذخیره",
    "Edit": "ویرایش",
    "Cancel": "لغو",
    "Confirm": "تایید",
    "Loading": "در حال بارگذاری",
    "Failed": "ناموفق",
    "Success": "موفقیت‌آمیز",
    "Empty": "خالی",
    "Apply": "اعمال",
    "Clear": "پاک کردن",
    "Filter": "فیلتر",
    "Sort": "مرتب‌سازی",
    "Newest": "تازه‌ترین",
    "Price: low to high": "قیمت: کم به زیاد",
    "Price: high to low": "قیمت: زیاد به کم",
    "Most popular": "محبوب‌ترین",
    "Search products": "جست‌وجوی محصولات",
    "Search catalogue": "جست‌وجوی کاتالوگ",
    "No results found.": "نتیجه‌ای یافت نشد.",
    "Try different keywords.": "کلیدواژه‌های دیگری امتحان کنید.",
    "Recently viewed": "بازدیدهای اخیر",
    "Recommended": "پیشنهادی",
    "Frequently bought": "معمولاً با هم خریداری می‌شود",
    "Newsletter": "خبرنامه",
    "Subscribe": "عضویت",
    "Your email": "ایمیل شما",
    "Submit": "ارسال",
    "Address": "آدرس",
    "City": "شهر",
    "Postal code": "کد پستی",
    "Phone": "شماره تماس",
    "Full name": "نام و نام خانوادگی",
    "Country": "کشور",
    "Notes": "یادداشت",
    "Order notes": "یادداشت سفارش",
    "Order summary": "جزئیات سفارش",
    "Shipping": "ارسال",
    "Payment": "پرداخت",
    "Review": "بررسی نهایی",
    "Place order": "ثبت سفارش",
    "Pay": "پرداخت",
    "Total": "جمع کل",
    "Discount": "تخفیف",
    "Coupon": "کد تخفیف",
    "Code": "کد",
    "Apply coupon": "اعمال کد تخفیف",
    "Coupon applied": "کد تخفیف اعمال شد",
    "Invalid coupon": "کد تخفیف نامعتبر",
    "Free shipping": "ارسال رایگان",
    "Standard shipping": "ارسال استاندارد",
    "Express shipping": "ارسال فوری",
    "Delivery": "تحویل",
    "Return": "بازگشت",
    "Refund": "استرداد وجه",
    "Track order": "پیگیری سفارش",
    "Order history": "تاریخچهٔ سفارش‌ها",
    "Order details": "جزئیات سفارش",
    "Shipping address": "آدرس ارسال",
    "Billing address": "آدرس صورتحساب",
    "Sign in": "ورود",
    "Sign up": "عضویت",
    "Forgot password": "رمز عبور را فراموش کردید؟",
    "Reset password": "بازنشانی رمز عبور",
    "Create account": "ایجاد حساب",
    "Already have an account": "از قبل حساب دارید؟",
    "Don't have an account": "حساب ندارید؟",
    "Welcome": "خوش آمدید",
    "Account": "حساب کاربری",
    "Profile": "پروفایل",
    "Settings": "تنظیمات",
    "Logout": "خروج",
    "Login": "ورود",
    "Orders": "سفارش‌ها",
    "Wishlist": "علاقه‌مندی‌ها",
    "Cart": "سبد خرید",
    "Checkout": "تکمیل سفارش",
    "Search": "جست‌وجو",
    "Menu": "منو",
    "Close": "بستن",
    "Open": "باز کردن",
    "Refresh": "تازه‌سازی",
    "More": "بیشتر",
    "View": "مشاهده",
    "Shop": "خرید",
    "New": "تازه",
    "Sale": "حراج",
    "Best": "بهترین",
    "Featured products": "محصولات ویژه",
    "Trending products": "محصولات پرطرفدار",
    "Editorial picks": "انتخاب‌های ادیتوریال",
    "Our story": "داستان ما",
    "Heritage": "میراث",
    "Craftsmanship": "هنر ساخت",
    "Materials": "مواد اولیه",
    "Atelier": "کارگاه",
    "Made in": "ساخته‌شده در",
    "Italy": "ایتالیا",
    "Japan": "ژاپن",
    "France": "فرانسه",
    "Lingerie care guide": "راهنمای نگهداری لباس زیر",
    "Bra fitting guide": "راهنمای انتخاب سایز سوتین",
    "Shipping & returns": "ارسال و بازگشت کالا",
    "Privacy policy": "حریم خصوصی",
    "Terms of service": "شرایط استفاده",
    "Contact us": "تماس با ما",
    "About us": "دربارهٔ ما",
    "FAQ": "پرسش‌های پرتکرار",
    "Help": "کمک",
    "Customer service": "خدمات مشتریان",
    "Support": "پشتیبانی",
    "Your cart is empty.": "سبد خرید شما خالی است.",
    "You may also like": "شاید این را هم بپسندید",
    "Bundles": "ست‌ها",
    "Matches with": "هماهنگ با",
    "Description": "توضیحات",
    "Details": "جزئیات",
    "Composition": "ترکیب",
    "Origin": "کشور سازنده",
    "Care": "نگهداری",
    "Reviews": "نظرات",
    "Write a review": "نوشتن نظر",
    "Rating": "امتیاز",
    "Verified purchase": "خرید تأییدشده",
    "Helpful": "مفید",
    "Report": "گزارش",
    "Out of stock": "ناموجود",
    "Restocked": "موجود مجدد",
    "Pre-order": "پیش‌سفارش",
    "Untitled": "بدون عنوان",
    "Archive": "بایگانی",
    "Drop or browse pieces of editorial photography. The first image\n        becomes the primary card on the storefront.": "تصاویر ادیتوریال را رها کنید یا از دستگاه انتخاب کنید. اولین تصویر به‌عنوان کارت اصلی در فروشگاه نمایش داده می‌شود.",
    "Storefront indexing puts each piece in one primary category.\n        Collections layer on top for grouping.": "دسته‌بندی فروشگاه هر تکه را در یک دستهٔ اصلی قرار می‌دهد. کالکسیون‌ها برای گروه‌بندی روی آن‌ها قرار می‌گیرند.",
    "Use collections to bundle the piece into seasonal stories and\n        merchandising modules.": "برای قرار دادن تکه در داستان‌های فصلی و ماژول‌های مرچندایزینگ از کالکسیون‌ها استفاده کنید.",
    "Layer size × colour combinations. Stock held in a row is never\n        hard-deleted — any variant removed from the table is\n        automatically flagged as unavailable so historical orders can\n        still be audited.": "ترکیب‌های سایز × رنگ را لایه‌بندی کنید. موجودیِ هر ردیف هرگز حذف سخت نمی‌شود — هر تنوعی که از جدول حذف شود، به‌طور خودکار به‌عنوان ناموجود علامت‌گذاری می‌شود تا سفارش‌های تاریخی همچنان قابل ممیزی باشند.",
    "Stock is owned by the Variants step. Use the matrix for column-level totals; reach out\n          about low-stock alerts from the dashboard.": "موجودی متعلق به مرحلهٔ تنوع‌ها است. برای جمع‌های سطح ستون از ماتریس استفاده کنید؛ برای هشدارهای کمبود موجودی به داشبورد مراجعه کنید.",
    "Search and social metadata. Description is mirrored into the\n        long-form copy until dedicated SEO fields land.": "متادیتای جست‌وجو و شبکه‌های اجتماعی. توضیحات در توضیحات بلند آینه می‌شود تا فیلدهای سئو اختصاصی در دسترس قرار گیرند.",
    "Toggle Featured": "تغییر ویژه",
    "Toggle Trending": "تغییر پرطرفدار",
    "Toggle Editorial pick": "تغییر انتخاب ادیتوریال",
    "Publish to storefront": "انتشار در فروشگاه",
    "Saved": "ذخیره شد",
    "Could not save": "ذخیره نشد",
    "Search by name, slug, collection…": "جست‌وجو بر اساس نام، اسلاگ یا کالکسیون…",
    "No matches.": "موردی یافت نشد.",
    "Try loosening the status filter or search.": "فیلتر وضعیت یا جست‌وجو را آسان‌تر کنید.",
    "No products drafted yet.": "هنوز محصولی پیش‌نویس نشده است.",
    "Hit New product above to open the first draft.": "برای باز کردن اولین پیش‌نویس، روی «محصول تازه» در بالا بزنید.",
    "Every piece in the ÆON catalogue — drafts, published, archived —\n            in one searchable table.": "هر تکه از کاتالوگ لونا — پیش‌نویس، منتشرشده، بایگانی‌شده — در یک جدول قابل جست‌وجو.",
    "Products": "محصولات",
    "Inventory": "موجودی",
    "Title": "عنوان",
    "Slug": "اسلاگ",
    "Category": "دسته‌بندی",
    "Collection": "کالکسیون",
    "Price (USD)": "قیمت (تومان)",
    "Compare-at (USD)": "قیمت قبلی (تومان)",
    "Optional strike-through price": "قیمت قبلی اختیاری",
    "Title tag": "برچسب عنوان",
    "Updated": "به‌روزرسانی‌شده",
    "Labels: Basic Info · Media · Categories · Collections · Variants · Pricing & Inventory · SEO · Publishing": "مراحل: اطلاعات پایه · رسانه · دسته‌بندی‌ها · کالکسیون‌ها · تنوع‌ها · قیمت و موجودی · سئو · انتشار",
    "Categories": "دسته‌بندی‌ها",
    "Variants": "تنوع‌ها",
    "Logo": "لوگو",
    "Logos": "لوگوها",
}

# Build file -> list of (line, old, new) edits
edits_by_file = {}
unmatched = []
matched_count = 0
for d in audit:
    f = pathlib.Path(d["file"])
    edits_by_file.setdefault(f, [])
    for line, attr, txt in d["hits"]:
        persian = T.get(txt)
        if persian is None:
            for k, v in T.items():
                if k.startswith(txt[:30]) or txt.startswith(k[:30]):
                    persian = v
                    break
        if persian is None:
            unmatched.append((str(f), line, attr, txt))
        else:
            matched_count += 1
            edits_by_file[f].append((line, txt, persian))

print(f"Matched: {matched_count}/{sum(d['count'] for d in audit)} English strings")
print(f"Unmatched: {len(unmatched)}")
for f, ln, at, t in unmatched[:30]:
    print(f"  {f}:L{ln} [{at}] {t[:80]!r}")

print("\n--- Applying edits ---")
total_files = 0
total_lines = 0
for f, edits in edits_by_file.items():
    if not edits:
        continue
    src = f.read_text(encoding="utf-8")
    lines = src.split("\n")
    applied = 0
    for line_no, old, new in edits:
        idx = line_no - 1
        if idx < 0 or idx >= len(lines):
            continue
        line = lines[idx]
        if old in line:
            lines[idx] = line.replace(old, new, 1)
            applied += 1
        else:
            print(f"  WARN {f.name}:L{line_no} - {old[:50]!r} not in line")
    f.write_text("\n".join(lines), encoding="utf-8")
    total_files += 1
    total_lines += applied
    print(f"  {f.name}: applied {applied}/{len(edits)}")

print(f"\nTotal: {total_lines} edits applied in {total_files} files")
