import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import WhatsAppWidget from "@/components/layout/WhatsAppWidget";
import { getPublishedPackages, getPublishedServices, groupByStage } from "@/lib/data";
import { getPublicSettings, DEFAULT_WHATSAPP } from "@/lib/settings";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

// Public content comes from MongoDB and is edited live in the admin: render per request so edits show immediately
// and `next build` never needs a database connection.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, packages, services] = await Promise.all([getPublicSettings(), getPublishedPackages(), getPublishedServices()]);

  // Services mega menu: grouped Start / Build / Grow (plus advisory), straight from the published services.
  const menu = groupByStage(services).map((g) => ({
    key: g.key, label: g.label, kicker: g.kicker,
    items: g.items.map((s) => ({ slug: s.slug, title: s.title, tagline: s.tagline ?? "", icon: s.icon ?? null })),
  }));

  // Organization structured data: only facts that are verified/present. The registration number is deliberately NOT included.
  const sameAs = [settings.linkedin, settings.twitter, settings.instagram, settings.facebook, settings.github].filter(Boolean);
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.companyName,
    url: SITE_URL,
    logo: absoluteUrl("/og-image.png"),
    email: settings.publicEmail,
    address: { "@type": "PostalAddress", addressLocality: settings.city, addressCountry: settings.country },
    ...(sameAs.length ? { sameAs } : {}),
  };

  return (
    <>
      <a href="#main" className="sr-only-focusable fixed left-4 top-4 z-[100] rounded-full bg-leaf px-5 py-3 font-semibold text-ink">Skip to content</a>
      <SiteHeader showPricing={packages.length > 0} menu={menu} />
      <div id="site-content">
        <main id="main" tabIndex={-1} className="outline-none">{children}</main>
        <SiteFooter
          settings={settings}
          showPricing={packages.length > 0}
          services={services.slice(0, 5).map((s) => ({ title: s.title, slug: s.slug }))}
        />
      </div>
      <WhatsAppWidget number={settings.whatsapp || DEFAULT_WHATSAPP} company={settings.companyName} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, "\\u003c") }} />
    </>
  );
}
