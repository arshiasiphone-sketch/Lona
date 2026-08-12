/** Shared server-side image validation for product and library uploads. */

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
]);

export const MAX_LIBRARY_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

/** Normalize Content-Type values before comparing storage metadata. */
export function normalizeImageContentType(
  contentType: string | null | undefined,
): string | undefined {
  const normalized = contentType?.trim().toLowerCase().split(";", 1)[0];
  if (!normalized) return undefined;
  return normalized === "image/jpg" ? "image/jpeg" : normalized;
}

export function isAllowedImageType(contentType: string | undefined): boolean {
  const normalized = normalizeImageContentType(contentType);
  return normalized !== undefined && ALLOWED_IMAGE_TYPES.has(normalized);
}
