#!/usr/bin/env python3
"""Phase 5.9 — supplementary translation pass for residual English.

Handles the remaining 107 hits after pass 1. Smarter matching:
  - Substring anchors (skip quotes) for JSX text and aria-labels.
  - Latin LONA kept as-is (brand display styling).
  - name@example.com kept as standard placeholder.
  - False positives (JSX-regex artifacts) skipped.
"""
import json, pathlib, re

# Load current audit
audit = json.load(open("/tmp/audit_refined.json"))

# Supplementary translation table — key is SUBSTRING (no quotes),
# value is Persian. Smarter keys: skip exact-string requirements.
T = {
    # ---- About.tsx (8) ----
    "A house for the slow": "خانه‌ای برای آهستگی",
    "the quietly distinguished": "و وقار بی‌صدا",
    "Each piece is finished by a single maker": "هر تکه توسط تنها یک هنرمند به پایان می‌رسد",
    "label inside is their name": "برچسب داخلی، نام همان هنرمند است",
    "Slow, by design": "کند، به‌عمد",
    "Three rooms": "سه فضای صمیمی",
    "Write to the atelier": "با کارگاه گفت‌وگو کنید",
    "Replies arrive within 24 hours": "پاسخ در کمتر از ۲۴ ساعت",
    "Natural fiber base across the Permanent collection": "پایه‌ی الیاف طبیعی در سری ماندگار لونا",
    "Average CO": "میانگین کربن برای هر تکه، ممیزی سالانه",
    "Repair, not replace": "تعمیر، نه تعویض — بازگشت به کارگاه سازنده",
    "Personal Concierge": "مشاور شخصی",
    # ---- Author / address ----
    "concierge@aeon.studio": "concierge@lona.studio",
    "Via dei Giardini 14": "Via dei Giardini 14",
    # ---- Collection/Collections ----
    "All Collections": "همهٔ کالکسیون‌ها",
    "Enter Collection": "ورود به کالکسیون",
    "Refined twice yearly": "دو بار در سال بازنگری‌شده",
    # ---- Press ----
    "Long form from the house": "روایت‌های بلند از خانهٔ لونا",
    "More to come": "داستان‌های بیشتر در راه است",
    "Subscribe to the seasonal letter": "برای عضویت در خبرنامهٔ فصلی، به پایین هر صفحه مراجعه کنید",
    "The Journal": "مجلهٔ لونا",
    # ---- BundleSuggestions ----
    "new Set": "ست تازه",
    "Considered Together": "هماهنگ انتخاب‌شده",
    "Frequently with": "معمولاً با",
    "Customers often add these together": "مشتریان معمولاً اینها را با هم اضافه می‌کنند",
    "Together": "با هم",
    "Add Selection": "افزودن انتخاب",
    # ---- EmptyStates ----
    "Quiet, for now": "برای لحظاتی، ساکت",
    "Your bag is currently empty": "سبد خرید شما خالی است",
    "Begin with the season": "با تکه‌های تازهٔ فصل شروع کنید",
    "View Catalogue": "مشاهدهٔ کاتالوگ",
    "Browse Catalogue": "مرور کاتالوگ",
    "Nothing saved yet": "هنوز چیزی ذخیره نشده است",
    "Heart a piece to keep it here": "برای نگه‌داشتن یک تکه، قلب آن را بزنید",
    "Wishlist items persist for ninety days": "علاقه‌مندی‌ها برای نود روز باقی می‌مانند",
    # ---- FeaturedCollections / HeroChoreography ----
    "Four chapters. Every chapter is a question of cloth": "چهار فصل. هر فصل پرسشی از پارچه، خط و پوشیدن طولانی است",
    "Considered objects": "اشیای سنجیده",
    "quietly distinguished": "وقار بی‌صدا",
    "Pieces in rotation": "تکه‌های فعال",
    "Years refining": "سال‌های اصلاح",
    "Read the Editorial": "خواندن ادیتوریال",
    # ---- Recommendations / Testimonials ----
    "Considered for you": "برای شما سنجیده شده",
    "From your last visits": "از بازدیدهای اخیر شما",
    "From our patrons": "از همراهان لونا",
    "Read": "خواندن",
    # ---- MobileNav ----
    "Established 2012": "تأسیس ۱۳۹۸",
    "Journal": "مجله",
    # ---- ProductGallery aria ----
    "Hover to zoom": "برای بزرگ‌نمایی شناور کنید",
    "previous image": "تصویر قبلی",
    "next image": "تصویر بعدی",
    # ---- ProductList.tsx remaining ----
    "Publish": "انتشار",  # already in T; skip duplicates
    "Products": "محصولات",
    "Begin a draft": "شروع پیش‌نویس",
    # ---- ProductWizard.tsx remaining ----
    "Back to catalogue": "بازگشت به کاتالوگ",
    "Continue": "ادامه",
    "Restore as draft": "بازنشانی به پیش‌نویس",
    # ---- ShippingEstimator ----
    "Standard \u00b7 DHL": "استاندارد \u00b7 DHL",
    "Express \u00b7 DHL": "فوری \u00b7 DHL",
    "White-glove \u00b7 local courier": "ارسال ویژه \u00b7 پیک محلی",
    "Standard \u00b7 Sagawa": "استاندارد \u00b7 ساگاوا",
    "Express \u00b7 Yamato": "فوری \u00b7 یاماتو",
    "Same/Next-day in major cities": "همان روز / روز بعد در شهرهای بزرگ",
    "United States": "ایالات متحده",
    "European Union": "اتحادیهٔ اروپا",
    "United Kingdom": "بریتانیا",
    "Japan": "ژاپن",
    "Rest of world": "سایر کشورها",
    "Postal / ZIP code": "کد پستی",
    # ---- SortDropdown ----
    "Price \u00b7 Low \u2192 High": "قیمت \u00b7 کم به زیاد",
    "Price \u00b7 High \u2192 Low": "قیمت \u00b7 زیاد به کم",
    # ---- ViewToggle ----
    "Grid": "شبکه‌ای",
    "List": "فهرست",
    "list view": "نمای فهرستی",
    # ---- Pagination ----
    "Go to previous page": "رفتن به صفحهٔ قبل",
    "Go to next page": "رفتن به صفحهٔ بعد",
    "pagination": "صفحه‌بندی",
    # ---- VariantPicker / VariantEditor ----
    "Size guide": "راهنمای سایز",
    "Pick at least one colour and one size in": "حداقل یک رنگ و یک سایز انتخاب کنید",
    # ---- InfiniteSentinel ----
    "The next page is on its way": "صفحهٔ بعدی در راه است",
    # ---- sidebar ----
    "Sidebar": "نوار کناری",
    "Displays the mobile sidebar": "نمایش نوار کناری در موبایل",
    "Toggle Sidebar": "تغییر نوار کناری",
    # ---- breadcrumb / carousel ----
    "breadcrumb": "مسیر ناوبری",
    "carousel": "چرخ‌نما",
    "slide": "اسلاید",
    # ---- MediaUploader remaining ----
    "Browse from device": "انتخاب از دستگاه",
    "Attached": "پیوست شد",
    "No preview": "بدون پیش‌نمایش",
    "Delete": "حذف",
}

# Don't touch:
SKIP_PATTERNS = [
    "name@example.com",         # standard placeholder
    "error?.message",           # JSX regex artifact
    "setCategory(c as Doc",     # JSX regex artifact
]

edits_by_file = {}
unmatched = []
applied_count = 0
for d in audit:
    f = pathlib.Path(d["file"])
    edits_by_file.setdefault(f, [])
    for line, attr, txt in d["hits"]:
        if any(skip in txt for skip in SKIP_PATTERNS):
            continue
        # 'LONA' brand display kept as Latin
        if txt.strip() == "LONA":
            continue
        # search substring dictionary: find a key that is a substring of txt (or vice-versa)
        persian = None
        matched_key = None
        for k, v in T.items():
            if k in txt or txt.startswith(k):
                persian = v
                matched_key = k
                break
        if persian is None:
            unmatched.append((str(f), line, attr, txt))
        else:
            applied_count += 1
            edits_by_file[f].append((line, txt, persian, matched_key))

print(f"Applied so far (planned): {applied_count}")
print(f"Unmatched after pass 2 plan: {len(unmatched)}")
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
    for line_no, old, new, key in edits:
        idx = line_no - 1
        if idx < 0 or idx >= len(lines):
            continue
        line = lines[idx]
        # Replace the key substring ONCE on this line; preserve any quote wrapping
        if key in line:
            lines[idx] = line.replace(key, new, 1)
            applied += 1
        else:
            # try a slightly relaxed match: trim whitespace
            if key.strip() in line:
                lines[idx] = line.replace(key.strip(), new, 1)
                applied += 1
            else:
                print(f"  WARN {f.name}:L{line_no} - {key[:30]!r} not in line")
    f.write_text("\n".join(lines), encoding="utf-8")
    total_files += 1
    total_lines += applied

print(f"\nPass 2 totals: {total_lines} edits applied in {total_files} files")
