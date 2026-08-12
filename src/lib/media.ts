/** Shared image upload rules for the admin UI. */

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
] as const;

export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

export const IMAGE_ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");
export const MAX_LIBRARY_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

const MIME_BY_EXTENSION: Record<string, AcceptedImageType> = {
  avif: "image/avif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * Resolve a safe image MIME type from the browser declaration or filename.
 * Some browsers return an empty `File.type` for files with non-Latin names,
 * so the extension is a deliberate fallback for the upload request header.
 */
export function getImageContentType(file: {
  name: string;
  type?: string | null;
}): AcceptedImageType | null {
  const declared = file.type?.trim().toLowerCase().split(";", 1)[0] ?? "";
  if (declared === "image/jpg") return "image/jpeg";
  if ((ACCEPTED_IMAGE_TYPES as readonly string[]).includes(declared)) {
    return declared as AcceptedImageType;
  }

  const extension = file.name.split(".").pop()?.trim().toLowerCase() ?? "";
  return MIME_BY_EXTENSION[extension] ?? null;
}

export function formatAcceptedImageTypes(): string {
  return "PNG، JPG، WebP یا AVIF";
}
