import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.calstins.com").replace(/\/$/, "");
export const SITE_NAME = "Calstins Ltd";
export const absoluteUrl = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Per-route metadata with a canonical URL and Open Graph/Twitter parity. */
export function pageMetadata(opts: { title: string; description: string; path: string; image?: string | null; noindex?: boolean; type?: "website" | "article" }): Metadata {
  const image = opts.image || "/og-image.png";
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    robots: opts.noindex ? { index: false, follow: true } : undefined,
    openGraph: { type: opts.type ?? "website", url: opts.path, siteName: SITE_NAME, title: opts.title, description: opts.description, images: [{ url: image }], locale: "en_NG" },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description, images: [image] },
  };
}
