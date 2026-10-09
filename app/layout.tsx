import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

// Self-hosted variable fonts (latin subset): one display face, one text face, no render-blocking CSS import.
const display = localFont({
  src: "./fonts/bricolage-grotesque-latin-wght-normal.woff2",
  variable: "--font-display",
  weight: "200 800",
  display: "swap",
});
const body = localFont({
  src: "./fonts/hanken-grotesk-latin-wght-normal.woff2",
  variable: "--font-body",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Calstins Ltd — Technology Advisory & Delivery in Nigeria", template: "%s | Calstins Ltd" },
  description:
    "Calstins Ltd is a technology advisory and delivery firm in Abuja, Nigeria: strategy, IT consulting and networking, software delivery and long-term partnership.",
  applicationName: SITE_NAME,
  authors: [{ name: "Caleb Opule", url: SITE_URL }],
  creator: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "/",
    siteName: SITE_NAME,
    title: "Calstins Ltd — Technology Advisory & Delivery",
    description: "Strategy, delivery and the long-term partnership that follows. Based in Abuja, Nigeria.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Calstins Ltd" }],
  },
  twitter: { card: "summary_large_image", title: "Calstins Ltd — Technology Advisory & Delivery", description: "Strategy, delivery and the long-term partnership that follows.", images: ["/og-image.png"] },
  robots: { index: true, follow: true },
  icons: { icon: [{ url: "/favicon-32x32.png", sizes: "32x32" }, { url: "/favicon-16x16.png", sizes: "16x16" }], apple: "/apple-touch-icon.png" },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = { themeColor: "#172532", width: "device-width", initialScale: 1 };

// Adds `js` before first paint so CSS can pre-hide opted-in hero elements ONLY when scripting is available.
const JS_FLAG = `document.documentElement.classList.add('js')`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: JS_FLAG }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
