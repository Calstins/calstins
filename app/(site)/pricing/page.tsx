import Intro from "@/components/motion/Intro";
import Reveal from "@/components/motion/Reveal";
import ArrowButton from "@/components/ui/ArrowButton";
import FaqList from "@/components/ui/FaqList";
import PackageCard from "@/components/ui/PackageCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { getEngagementModes, getPublishedFaqs, getPublishedPackages, groupByStage } from "@/lib/data";
import { getPublicSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const packages = await getPublishedPackages();
  return pageMetadata({
    title: "Packages & Pricing",
    description: "Transparent packages with clear inclusions, delivery estimates and honest price labels: fixed, starting from, range or custom quote.",
    path: "/pricing",
    noindex: packages.length === 0, // an empty price page should not be indexed
  });
}

export default async function PricingPage() {
  const [packages, faqs, modes, settings] = await Promise.all([getPublishedPackages(), getPublishedFaqs(), getEngagementModes(), getPublicSettings()]);
  const groups = groupByStage(packages);
  const generalFaqs = faqs.filter((f) => !f.serviceId).slice(0, 8);

  return (
    <>
      <section className="surface-dark">
        <Intro className="container-wide pb-20 pt-20 md:pb-28 md:pt-28">
          <p data-anim className="eyebrow mb-8">Packages &amp; pricing</p>
          <h1 data-anim data-split className="t-h1 max-w-5xl">Clear scope. <br /><span className="accent-word">Honest pricing.</span></h1>
          <p data-anim className="t-lead mt-8 text-[color:var(--on-dark-muted)]">
            {packages.length > 0
              ? "Every package lists what is included, how long it typically takes and what kind of price it is. Where scope varies we say so and quote after a conversation."
              : "We scope and quote each engagement individually. Tell us what you are trying to achieve and we will come back with a clear proposal."}
          </p>
          <div data-anim className="mt-10"><ArrowButton href="/contact">Request a quote</ArrowButton></div>
        </Intro>
      </section>

      {groups.map((g, i) => (
        <section key={g.key} className={`${i % 2 === 0 ? "surface-light" : "surface-light-2"} section`} aria-labelledby={`stage-${g.key}`}>
          <div className="container-wide">
            <SectionHeader eyebrow={g.kicker} title={<span id={`stage-${g.key}`}>{g.label}</span>} lead={g.intro} />
            <Reveal className={`mt-14 grid gap-5 ${g.items.length === 1 ? "max-w-4xl" : "md:grid-cols-2 xl:grid-cols-3"}`}>
              {g.items.map((p) => <div key={p.id} data-reveal><PackageCard pkg={p} disclaimer={settings.pricingDisclaimer} wide={g.items.length === 1} /></div>)}
            </Reveal>
          </div>
        </section>
      ))}

      {packages.length === 0 && modes.length > 0 && (
        <section className="surface-light section">
          <div className="container-wide">
            <SectionHeader eyebrow="How we engage" title={<>Three ways to <span className="accent-word">start.</span></>} />
            <Reveal className="mt-14 grid gap-5 lg:grid-cols-3">
              {modes.map((m) => <article key={m.id} data-reveal className="panel"><p className="chip">{m.tag}</p><h3 className="t-h3 mt-5">{m.title}</h3><p className="muted mt-3">{m.description}</p></article>)}
            </Reveal>
          </div>
        </section>
      )}

      <section className="surface-light-2 section">
        <div className="container-wide grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <div><p className="eyebrow mb-5">Reading our prices</p><h2 className="t-h2">What the labels <span className="accent-word">mean.</span></h2></div>
          <dl className="grid gap-6 sm:grid-cols-2">
            {[
              ["Fixed price", "One price for the stated scope."],
              ["Starting from", "The lowest price for the scope described; the final quote depends on your requirements."],
              ["Price range", "Typical low and high; we confirm the figure once we understand the work."],
              ["Custom quote", "No figure is shown because scope varies. We quote after a conversation."],
            ].map(([t, d]) => <div key={t} className="panel !p-6"><dt className="font-display text-lg font-semibold">{t}</dt><dd className="muted mt-2 text-[0.95rem]">{d}</dd></div>)}
          </dl>
          {settings.pricingDisclaimer && <p className="muted text-sm lg:col-start-2">{settings.pricingDisclaimer}</p>}
        </div>
      </section>

      {generalFaqs.length > 0 && (
        <section className="surface-light section">
          <div className="container-wide grid gap-14 lg:grid-cols-[1fr_1.6fr]">
            <div><p className="eyebrow mb-5">FAQs</p><h2 className="t-h2">Pricing <span className="accent-word">questions.</span></h2></div>
            <FaqList items={generalFaqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))} />
          </div>
        </section>
      )}

      <section className="bg-leaf text-[color:var(--ink)]">
        <div className="container-wide section flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <h2 className="t-h2 max-w-2xl">Not sure which fits? Tell us what you need.</h2>
          <ArrowButton href="/contact" variant="ink">Request a proposal</ArrowButton>
        </div>
      </section>
    </>
  );
}
