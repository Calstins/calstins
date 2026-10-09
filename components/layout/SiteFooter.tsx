import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import Logo from "@/components/brand/Logo";
import type { PublicSettings } from "@/lib/settings";

const SOCIALS: { key: keyof PublicSettings; label: string }[] = [
  { key: "linkedin", label: "LinkedIn" },
  { key: "twitter", label: "X" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "github", label: "GitHub" },
];

export default function SiteFooter({ settings, services, showPricing }: { settings: PublicSettings; services: { title: string; slug: string }[]; showPricing: boolean }) {
  const year = new Date().getFullYear();
  const waDigits = settings.whatsapp?.replace(/[^\d]/g, "");
  const place = [settings.addressLine, settings.city, settings.country].filter(Boolean).join(", ");
  const company = [
    { href: "/about", label: "About" },
    { href: "/work", label: "Work" },
    ...(showPricing ? [{ href: "/pricing", label: "Pricing" }] : []),
    { href: "/blog", label: "Insights" },
    { href: "/contact", label: "Contact" },
  ];
  const socials = SOCIALS.filter((s) => settings[s.key]);

  return (
    <footer className="surface-dark on-dark border-t border-white/10">
      <div className="container-wide py-16 md:py-24">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="Calstins Ltd home" className="block w-56"><Logo className="w-full" sizes="224px" /></Link>
            <p className="mt-6 max-w-sm leading-relaxed" style={{ color: "var(--on-dark-muted)" }}>
              {settings.tagline || "Technology advisory and delivery for organisations that take their technology seriously. Strategy, delivery, and the long-term partnership that follows."}
            </p>
            <ul className="mt-8 space-y-3 text-[0.95rem]">
              <li><a className="inline-flex items-center gap-3 hover:text-leaf" href={`mailto:${settings.publicEmail}`}><Mail size={16} className="text-leaf" aria-hidden />{settings.publicEmail}</a></li>
              {settings.phone && <li><a className="inline-flex items-center gap-3 hover:text-leaf" href={`tel:${settings.phone.replace(/\s/g, "")}`}><Phone size={16} className="text-leaf" aria-hidden />{settings.phone}</a></li>}
              {waDigits && <li><a className="inline-flex items-center gap-3 hover:text-leaf" href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer"><span aria-hidden className="grid h-4 w-4 place-items-center text-[10px] font-bold text-leaf">WA</span>WhatsApp<span className="sr-only"> (opens in a new tab)</span></a></li>}
              {place && <li className="inline-flex items-center gap-3"><MapPin size={16} className="text-leaf" aria-hidden />{place}</li>}
            </ul>
          </div>

          <nav aria-label="Services">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-leaf">Services</h2>
            <ul className="mt-5 space-y-3">
              {services.map((s) => <li key={s.slug}><Link className="hover:text-leaf" href={`/services/${s.slug}`}>{s.title}</Link></li>)}
              <li><Link className="font-semibold underline underline-offset-4 hover:text-leaf" href="/services">All services</Link></li>
            </ul>
          </nav>

          <nav aria-label="Company">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-leaf">Company</h2>
            <ul className="mt-5 space-y-3">
              {company.map((l) => <li key={l.href}><Link className="hover:text-leaf" href={l.href}>{l.label}</Link></li>)}
            </ul>
            {socials.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Social profiles">
                {socials.map((s) => <li key={s.key}><a className="underline underline-offset-4 hover:text-leaf" href={settings[s.key] as string} target="_blank" rel="noopener noreferrer">{s.label}<span className="sr-only"> (opens in a new tab)</span></a></li>)}
              </ul>
            )}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-8 text-sm md:flex-row md:items-center md:justify-between" style={{ color: "var(--on-dark-muted)" }}>
          <p>© {year} {settings.legalName || settings.companyName}. All rights reserved.</p>
          <p>{settings.registrationNumber ? <>Registration number: <span className="text-white">{settings.registrationNumber}</span></> : "Registration number available on request."}</p>
        </div>
      </div>
    </footer>
  );
}
