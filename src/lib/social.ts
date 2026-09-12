/**
 * LONA — social link helpers.
 *
 * Single source of truth for validating and normalizing the Instagram /
 * Telegram / WhatsApp URLs an admin stores in `settings.store.social`.
 *
 * Rules
 * ─────
 *   • Only `http(s)` links are ever returned. `javascript:`, `data:`,
 *     `vbscript:` and any other scheme is rejected outright.
 *   • A bare handle (`@lona` or `lona`) is expanded to the network's
 *     canonical profile URL.
 *   • A scheme-less domain is treated as `https://`.
 *   • The hostname must belong to the network being edited, so an
 *     Instagram field can never silently point somewhere else.
 *   • An empty value is valid and means "hide this link".
 */

export type SocialNetwork = "instagram" | "telegram" | "whatsapp";

export interface SocialNetworkSpec {
  key: SocialNetwork;
  label: string;
  labelFa: string;
  placeholder: string;
  /** Canonical host used when expanding a bare handle. */
  defaultHost: string;
  /** Accepted hostnames (without a leading `www.`). */
  hosts: string[];
}

export const SOCIAL_NETWORKS: readonly SocialNetworkSpec[] = [
  {
    key: "instagram",
    label: "Instagram",
    labelFa: "اینستاگرام",
    placeholder: "https://instagram.com/lonaboutique",
    defaultHost: "instagram.com",
    hosts: ["instagram.com"],
  },
  {
    key: "telegram",
    label: "Telegram",
    labelFa: "تلگرام",
    placeholder: "https://t.me/lona_official",
    defaultHost: "t.me",
    hosts: ["t.me", "telegram.me"],
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    labelFa: "واتساپ",
    placeholder: "https://wa.me/989121234567",
    defaultHost: "wa.me",
    hosts: ["wa.me", "api.whatsapp.com", "whatsapp.com"],
  },
];

const SPEC_BY_KEY: Record<SocialNetwork, SocialNetworkSpec> = {
  instagram: SOCIAL_NETWORKS[0],
  telegram: SOCIAL_NETWORKS[1],
  whatsapp: SOCIAL_NETWORKS[2],
};

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const SAFE_SCHEME = /^https?:\/\//i;

/** Persian validation message for the admin panel. */
export const SOCIAL_URL_ERROR =
  "آدرس شبکه اجتماعی معتبر نیست. یک نشانی http(s) از همین شبکه وارد کنید (مثال: https://instagram.com/…).";

/**
 * Normalize a raw admin input for `network`.
 *
 * @returns the canonical `http(s)` URL, `""` when the field is empty
 *          (meaning "hidden"), or `null` when the input is invalid.
 */
export function normalizeSocialUrl(
  network: SocialNetwork,
  raw: string | null | undefined,
): string | null {
  const value = (raw ?? "").trim();
  if (!value) return "";

  const spec = SPEC_BY_KEY[network];
  let candidate = value;

  if (HAS_SCHEME.test(candidate)) {
    if (!SAFE_SCHEME.test(candidate)) return null;
  } else if (candidate.startsWith("@")) {
    candidate = `https://${spec.defaultHost}/${candidate.slice(1)}`;
  } else if (!candidate.includes(".") && !candidate.includes("/")) {
    candidate = `https://${spec.defaultHost}/${candidate}`;
  } else {
    candidate = `https://${candidate}`;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!spec.hosts.includes(host)) return null;

  return url.toString();
}

/**
 * Normalize `social` for persistence. Invalid entries are dropped
 * rather than stored — the storefront can then render the object
 * without re-validating.
 */
export function sanitizeSocial(
  social: Record<string, unknown> | undefined,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const spec of SOCIAL_NETWORKS) {
    const raw = social?.[spec.key];
    if (typeof raw !== "string") continue;
    const normalized = normalizeSocialUrl(spec.key, raw);
    if (normalized) result[spec.key] = normalized;
  }
  return result;
}

/**
 * Safe render value for the storefront. Returns the URL when it is a
 * valid `http(s)` link, otherwise `null` so the caller can skip it
 * instead of rendering an unsafe `href`.
 */
export function socialHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!SAFE_SCHEME.test(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
