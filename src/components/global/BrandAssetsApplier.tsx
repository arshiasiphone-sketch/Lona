/**
 * Lona — Brand assets applier.
 *
 * Mounted once inside the page shell. Reads the admin-configured
 * brand image slots (`favicon`, `og_image`) from the shared homepage
 * image map and applies them to the document head:
 *
 *   • favicon  — rewrites `<link rel="icon">` when an override exists.
 *   • og_image — swaps the *default* OpenGraph / Twitter image meta so
 *                pages that don't ship their own og:image inherit the
 *                brand asset. Pages that pass an explicit ogImage (e.g.
 *                product pages) are left untouched.
 *
 * Renders nothing.
 */
import * as React from "react";
import { useHomepageImages } from "@/lib/homepage-images";

const DEFAULT_LOGO = "/logo.svg";

export function BrandAssetsApplier() {
  const images = useHomepageImages();

  React.useEffect(() => {
    // Favicon — swap the browser tab icon when the admin set one.
    const favicon = images.favicon?.trim();
    if (favicon && favicon !== DEFAULT_LOGO) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.type = "image/svg+xml";
      link.href = favicon;
    }

    // Default OG image — only replaces the placeholder default, so
    // page-level og:image values (products, editorials) win.
    const og = images.og_image?.trim();
    if (og && og !== DEFAULT_LOGO) {
      const origin = window.location.origin;
      const applyIfDefault = (
        selector: string,
        expected: string,
      ) => {
        const el = document.querySelector<HTMLMetaElement>(selector);
        if (el && el.content === expected) el.content = og;
      };
      applyIfDefault('meta[property="og:image"]', `${origin}${DEFAULT_LOGO}`);
      applyIfDefault('meta[name="twitter:image"]', `${origin}${DEFAULT_LOGO}`);
    }
  }, [images.favicon, images.og_image]);

  return null;
}
