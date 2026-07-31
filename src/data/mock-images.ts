/**
 * Temporary editorial image pool for Lona's mock storefront.
 *
 * These URLs are intentionally centralized so homepage and editorial surfaces
 * share one consistent image source while the real media library is pending.
 */
export const LONA_MOCK_IMAGES = {
  editorialPortrait: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1400&q=82",
  editorialFashion: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1400&q=82",
  softPortrait: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1400&q=82",
  wardrobe: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=82",
  silkDetail: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=1400&q=82",
  neutralFashion: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=82",
  laceDetail: "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=1400&q=82",
  bridalMood: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1400&q=82",
  flatLay: "https://images.unsplash.com/photo-1602810316693-3667c854239a?auto=format&fit=crop&w=1400&q=82",
  fabricFlatLay: "https://images.unsplash.com/photo-1599842057874-37393e9342df?auto=format&fit=crop&w=1400&q=82",
  softGarment: "https://images.unsplash.com/photo-1583845112203-29329902332e?auto=format&fit=crop&w=1400&q=82",
  activeMood: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1400&q=82",
} as const;

export type LonaMockImageKey = keyof typeof LONA_MOCK_IMAGES;
