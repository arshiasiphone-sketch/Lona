import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LONA_MOCK_IMAGES } from "@/data/mock-images";

export const HOMEPAGE_IMAGE_SLOTS = [
  { key: "hero", label: "تصویر اصلی هرو" },
  { key: "category_1", label: "دسته‌بندی ۱ · سوتین" },
  { key: "category_2", label: "دسته‌بندی ۲ · شورت" },
  { key: "category_3", label: "دسته‌بندی ۳ · ست لباس زیر" },
  { key: "category_4", label: "دسته‌بندی ۴ · لباس خواب" },
  { key: "category_5", label: "دسته‌بندی ۵ · لباس راحتی" },
  { key: "category_6", label: "دسته‌بندی ۶ · بادی" },
  { key: "category_7", label: "دسته‌بندی ۷ · گن" },
  { key: "category_8", label: "دسته‌بندی ۸ · لباس ورزشی" },
  { key: "category_9", label: "دسته‌بندی ۹ · اکسسوری" },
  { key: "category_10", label: "دسته‌بندی ۱۰ · عروس" },
  { key: "lookbook_1", label: "لوک‌بوک ۱ · صبح" },
  { key: "lookbook_2", label: "لوک‌بوک ۲ · بعدازظهر" },
  { key: "lookbook_3", label: "لوک‌بوک ۳ · شب" },
  { key: "instagram_1", label: "اینستاگرام ۱" },
  { key: "instagram_2", label: "اینستاگرام ۲" },
  { key: "instagram_3", label: "اینستاگرام ۳" },
  { key: "instagram_4", label: "اینستاگرام ۴" },
  { key: "instagram_5", label: "اینستاگرام ۵" },
  { key: "instagram_6", label: "اینستاگرام ۶" },
  { key: "featured_collection_1", label: "کالکشن منتخب ۱" },
  { key: "featured_collection_2", label: "کالکشن منتخب ۲" },
  { key: "featured_collection_3", label: "کالکشن منتخب ۳" },
  { key: "about_workshop", label: "درباره لونا · کارگاه" },
  { key: "collections_1", label: "کالکشن‌ها · تصویر ۱" },
  { key: "collections_2", label: "کالکشن‌ها · تصویر ۲" },
  { key: "collections_3", label: "کالکشن‌ها · تصویر ۳" },
  { key: "collections_4", label: "کالکشن‌ها · تصویر ۴" },
  { key: "collection_hero", label: "صفحه کالکشن · هرو" },
  { key: "press_hero", label: "مجله · هرو" },
  { key: "press_1", label: "مجله · تصویر ۱" },
  { key: "press_2", label: "مجله · تصویر ۲" },
  { key: "press_3", label: "مجله · تصویر ۳" },
  { key: "press_4", label: "مجله · تصویر ۴" },
] as const;

export type HomepageImageSlot = (typeof HOMEPAGE_IMAGE_SLOTS)[number]["key"];
export type HomepageImageOverrides = Partial<Record<HomepageImageSlot, string>>;
export type HomepageImageMap = Record<HomepageImageSlot, string>;

export const DEFAULT_HOMEPAGE_IMAGES: HomepageImageMap = {
  hero: LONA_MOCK_IMAGES.editorialPortrait,
  category_1: LONA_MOCK_IMAGES.softGarment,
  category_2: LONA_MOCK_IMAGES.flatLay,
  category_3: LONA_MOCK_IMAGES.laceDetail,
  category_4: LONA_MOCK_IMAGES.silkDetail,
  category_5: LONA_MOCK_IMAGES.wardrobe,
  category_6: LONA_MOCK_IMAGES.neutralFashion,
  category_7: LONA_MOCK_IMAGES.editorialFashion,
  category_8: LONA_MOCK_IMAGES.activeMood,
  category_9: LONA_MOCK_IMAGES.fabricFlatLay,
  category_10: LONA_MOCK_IMAGES.bridalMood,
  lookbook_1: LONA_MOCK_IMAGES.editorialFashion,
  lookbook_2: LONA_MOCK_IMAGES.wardrobe,
  lookbook_3: LONA_MOCK_IMAGES.editorialFashion,
  instagram_1: LONA_MOCK_IMAGES.editorialPortrait,
  instagram_2: LONA_MOCK_IMAGES.silkDetail,
  instagram_3: LONA_MOCK_IMAGES.softPortrait,
  instagram_4: LONA_MOCK_IMAGES.laceDetail,
  instagram_5: LONA_MOCK_IMAGES.fabricFlatLay,
  instagram_6: LONA_MOCK_IMAGES.neutralFashion,
  featured_collection_1: LONA_MOCK_IMAGES.softGarment,
  featured_collection_2: LONA_MOCK_IMAGES.silkDetail,
  featured_collection_3: LONA_MOCK_IMAGES.neutralFashion,
  about_workshop: LONA_MOCK_IMAGES.editorialFashion,
  collections_1: LONA_MOCK_IMAGES.editorialFashion,
  collections_2: LONA_MOCK_IMAGES.silkDetail,
  collections_3: LONA_MOCK_IMAGES.wardrobe,
  collections_4: LONA_MOCK_IMAGES.neutralFashion,
  collection_hero: LONA_MOCK_IMAGES.editorialFashion,
  press_hero: LONA_MOCK_IMAGES.editorialFashion,
  press_1: LONA_MOCK_IMAGES.silkDetail,
  press_2: LONA_MOCK_IMAGES.wardrobe,
  press_3: LONA_MOCK_IMAGES.neutralFashion,
  press_4: LONA_MOCK_IMAGES.editorialFashion,
};

function normalizeOverrides(value: unknown): HomepageImageOverrides {
  if (!value || typeof value !== "object") return {};
  const source = value as Record<string, unknown>;
  const result: HomepageImageOverrides = {};
  for (const { key } of HOMEPAGE_IMAGE_SLOTS) {
    const candidate = source[key];
    if (typeof candidate === "string" && candidate.trim()) {
      result[key] = candidate.trim();
    }
  }
  return result;
}

export function useHomepageImages(): HomepageImageMap {
  const overrides = useQuery(api.admin_settings.getPublicHomepageImages, {});
  return useMemo(() => {
    const normalized = normalizeOverrides(overrides);
    return { ...DEFAULT_HOMEPAGE_IMAGES, ...normalized };
  }, [overrides]);
}

export function resolveHomepageImage(
  slot: HomepageImageSlot,
  overrides?: HomepageImageOverrides,
): string {
  const candidate = overrides?.[slot];
  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : DEFAULT_HOMEPAGE_IMAGES[slot];
}
