import Link from "next/link";
import { ArrowRight, Check, Clock, Minus } from "lucide-react";
import type { ServicePackage } from "@prisma/client";
import { formatPrice } from "@/lib/pricing";

/** One package. The price block always carries an explicit label (Fixed / Starting from / Range / Custom quote). */
export default function PackageCard({ pkg, disclaimer, wide = false }: { pkg: ServicePackage; disclaimer?: string | null; wide?: boolean }) {
  const price = formatPrice(pkg);
  const featured = pkg.featured;
  const href = pkg.ctaUrl || `/contact?package=${encodeURIComponent(pkg.slug)}`;
  const label = pkg.ctaLabel || (price.isQuote ? "Request a quote" : "Get started");
  const dark = featured;
  const sub = dark ? "text-[color:var(--on-dark-muted)]" : "muted";
  return (
    <article className={`${dark ? "panel-dark on-dark" : "panel"} flex h-full flex-col`} aria-labelledby={`pkg-${pkg.slug}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {pkg.audience && <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.14em] ${dark ? "text-leaf" : "text-[color:var(--leaf-700)]"}`}>{pkg.audience}</p>}
          <h3 id={`pkg-${pkg.slug}`} className="t-h3">{pkg.name}</h3>
        </div>
        {featured && <span className="chip shrink-0 text-leaf" style={{ borderColor: "var(--leaf)" }}>Most requested</span>}
      </div>
      <p className={`mt-3 ${sub}`}>{pkg.summary}</p>

      <div className={`mt-6 border-y py-5 ${dark ? "border-white/15" : "border-[color:var(--line-light)]"}`}>
        <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${sub}`}>{price.typeLabel}</p>
        {price.amount ? (
          <p className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
            {price.amount} <span className={`text-base font-medium ${sub}`}>{price.period}</span>
          </p>
        ) : (
          <p className="mt-1 font-display text-2xl font-bold tracking-tight">Scoped to your needs</p>
        )}
        {pkg.deliveryTimeline && <p className={`mt-3 inline-flex items-center gap-2 text-sm ${sub}`}><Clock size={15} aria-hidden /> {pkg.deliveryTimeline}</p>}
      </div>

      <ul className={`mt-6 text-[0.95rem] ${wide ? "grid gap-x-10 gap-y-3 md:grid-cols-2" : "space-y-3"}`} aria-label="Included">
        {pkg.features.map((f) => <li key={f} className="flex gap-3"><Check size={18} className={`mt-0.5 shrink-0 ${dark ? "text-leaf" : "text-[color:var(--leaf-deep)]"}`} aria-hidden />{f}</li>)}
      </ul>
      {pkg.exclusions.length > 0 && (
        <ul className={`mt-5 space-y-2 text-sm ${sub}`} aria-label="Not included">
          {pkg.exclusions.map((f) => <li key={f} className="flex gap-3"><Minus size={16} className="mt-0.5 shrink-0" aria-hidden /><span><span className="sr-only">Not included: </span>{f}</span></li>)}
        </ul>
      )}
      {(pkg.notes || disclaimer) && <p className={`mt-5 text-xs leading-relaxed ${sub}`}>{pkg.notes || disclaimer}</p>}

      <div className="mt-auto pt-8">
        <Link href={href} className={`btn w-full ${dark ? "btn-leaf" : "btn-ink"}`}>{label}<span className="btn-arrow"><ArrowRight size={16} aria-hidden /></span></Link>
      </div>
    </article>
  );
}
