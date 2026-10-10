import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Clock } from "lucide-react";
import Intro from "@/components/motion/Intro";
import Reveal from "@/components/motion/Reveal";
import ArrowButton from "@/components/ui/ArrowButton";
import FaqList from "@/components/ui/FaqList";
import PackageCard from "@/components/ui/PackageCard";
import SectionHeader from "@/components/ui/SectionHeader";
import ServiceIcon from "@/components/ui/ServiceIcon";
import { getPublishedServiceBySlug, getPublishedServices } from "@/lib/data";
import { getPublicSettings } from "@/lib/settings";
import { STAGES, isStageKey } from "@/lib/stages";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const svc = await getPublishedServiceBySlug(slug);
  if (!svc) return { title: "Service not found", robots: { index: false } };
  return pageMetadata({ title: svc.seoTitle || svc.title, description: svc.seoDescription || svc.tagline || svc.description || "", path: `/services/${svc.slug}` });
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const [svc, all, settings] = await Promise.all([getPublishedServiceBySlug(slug), getPublishedServices(), getPublicSettings()]);
  if (!svc) notFound();

  const stageLabel = isStageKey(svc.stage) ? STAGES[svc.stage].label : "Advisory & delivery";
  const cta = { href: svc.ctaUrl || `/contact?service=${encodeURIComponent(svc.slug)}`, label: svc.ctaLabel || "Talk to us about this" };
  const idx = all.findIndex((s) => s.id === svc.id);
  const next = all.length > 1 ? all[(idx + 1) % all.length] : null;
  const faqLd = svc.faqs.length
    ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: svc.faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) }
    : null;
  const crumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Services", item: absoluteUrl("/services") },
    { "@type": "ListItem", position: 2, name: svc.title, item: absoluteUrl(`/services/${svc.slug}`) },
  ] };

  return (
    <>
      <section className="surface-dark">
        <Intro className="container-wide pb-20 pt-14 md:pb-28 md:pt-20">
          <nav data-anim aria-label="Breadcrumb" className="mb-12">
            <Link href="/services" className="inline-flex items-center gap-2 text-[color:var(--on-dark-muted)] hover:text-leaf"><ArrowLeft size={16} aria-hidden /> All services</Link>
          </nav>
          <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:items-end">
            <div>
              <p data-anim className="eyebrow mb-6">{svc.areaNumber ? `${svc.areaNumber} · ` : ""}{stageLabel}</p>
              <h1 data-anim data-split className="t-h1">{svc.title}</h1>
              <p data-anim className="t-lead mt-8 text-[color:var(--on-dark)]">{svc.tagline}</p>
              <div data-anim className="mt-10 flex flex-wrap items-center gap-4">
                <ArrowButton href={cta.href}>{cta.label}</ArrowButton>
                {svc.deliveryTimeline && <span className="inline-flex items-center gap-2 text-[color:var(--on-dark-muted)]"><Clock size={18} aria-hidden /> {svc.deliveryTimeline}</span>}
              </div>
            </div>
            <div data-anim className="hidden justify-end lg:flex"><span className="grid h-40 w-40 place-items-center rounded-full border border-leaf/40 text-leaf"><ServiceIcon name={svc.icon} size={64} /></span></div>
          </div>
        </Intro>
      </section>

      <section className="surface-light section">
        <div className="container-wide grid gap-14 lg:grid-cols-[1.2fr_1fr]">
          <Reveal self><p className="t-lead">{svc.description}</p></Reveal>
          {svc.scope.length > 0 && (
            <Reveal self>
              <h2 className="eyebrow mb-6">What you get</h2>
              <ul className="space-y-4">
                {svc.scope.map((s) => <li key={s} className="flex gap-3 border-b border-[color:var(--line-light)] pb-4"><Check size={20} className="mt-0.5 shrink-0 text-[color:var(--leaf-deep)]" aria-hidden />{s}</li>)}
              </ul>
            </Reveal>
          )}
        </div>
      </section>

      {svc.subItems.length > 0 && (
        <section className="surface-light-2 section">
          <div className="container-wide">
            <SectionHeader eyebrow="In detail" title={<>How we cover <span className="accent-word">{svc.title}.</span></>} />
            <Reveal className="mt-16 grid gap-5 md:grid-cols-2">
              {svc.subItems.map((sub) => (
                <article key={sub.id} data-reveal className="panel">
                  <h3 className="t-h3">{sub.heading}</h3>
                  <p className="muted mt-3">{sub.description}</p>
                  {sub.bullets.length > 0 && <ul className="mt-5 space-y-2 text-[0.95rem]">{sub.bullets.map((b) => <li key={b} className="flex gap-3"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--leaf-deep)]" />{b}</li>)}</ul>}
                </article>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {svc.packages.length > 0 && (
        <section className="surface-light section" id="packages">
          <div className="container-wide">
            <SectionHeader eyebrow="Packages" title={<>Choose how to <span className="accent-word">start.</span></>} lead="Every price is labelled as fixed, starting from, a range or a custom quote." />
            <Reveal className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {svc.packages.map((p) => <div key={p.id} data-reveal><PackageCard pkg={p} disclaimer={settings.pricingDisclaimer} /></div>)}
            </Reveal>
          </div>
        </section>
      )}

      {svc.faqs.length > 0 && (
        <section className="surface-light-2 section">
          <div className="container-wide grid gap-14 lg:grid-cols-[1fr_1.6fr]">
            <div><p className="eyebrow mb-5">FAQs</p><h2 className="t-h2">Common <span className="accent-word">questions.</span></h2></div>
            <FaqList items={svc.faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))} />
          </div>
        </section>
      )}

      <section className="surface-dark">
        <div className="container-wide section flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div><p className="eyebrow mb-5">Next step</p><h2 className="t-h2 max-w-2xl">Let&rsquo;s talk about <span className="accent-word">{svc.title.toLowerCase()}.</span></h2></div>
          <div className="flex flex-wrap gap-4">
            <ArrowButton href={cta.href}>{cta.label}</ArrowButton>
            {next && <ArrowButton href={`/services/${next.slug}`} variant="outline-dark">Next: {next.title}</ArrowButton>}
          </div>
        </div>
      </section>

      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd).replace(/</g, "\\u003c") }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs).replace(/</g, "\\u003c") }} />
    </>
  );
}
