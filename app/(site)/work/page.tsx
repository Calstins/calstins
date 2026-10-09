import Link from "next/link";
import Intro from "@/components/motion/Intro";
import Reveal from "@/components/motion/Reveal";
import ArrowButton from "@/components/ui/ArrowButton";
import RemoteImage from "@/components/ui/RemoteImage";
import SectionHeader from "@/components/ui/SectionHeader";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Work — Selected Engagements",
  description: "A selection of Calstins engagements delivering the full lifecycle, from strategy to launch and long-term partnership.",
  path: "/work",
});

export default async function WorkPage() {
  const [caseStudies, partners] = await Promise.all([
    prisma.project.findMany({ where: { partnership: false }, orderBy: { order: "asc" } }).catch(() => []),
    prisma.project.findMany({ where: { partnership: true }, orderBy: { order: "asc" } }).catch(() => []),
  ]);

  return (
    <>
      <section className="surface-dark">
        <Intro className="container-wide pb-20 pt-20 md:pb-28 md:pt-28">
          <p data-anim className="eyebrow mb-8">Selected work</p>
          <h1 data-anim data-split className="t-h1 max-w-5xl">Work that{" "}<br /><span className="accent-word">speaks for itself.</span></h1>
          <p data-anim className="t-lead mt-8 text-[color:var(--on-dark-muted)]">A selection of engagements where Calstins delivered the full lifecycle, from the first strategic question to the live product.</p>
        </Intro>
      </section>

      {caseStudies.length > 0 && (
        <section className="surface-light section">
          <div className="container-wide space-y-8">
            {caseStudies.map((p, i) => (
              <Reveal self key={p.id}>
                <article className="panel !p-0 overflow-hidden">
                  <div className={`grid ${p.coverImage ? "lg:grid-cols-2" : ""}`}>
                    {p.coverImage && <div className={`relative min-h-[16rem] bg-[color:var(--paper-2)] ${i % 2 ? "lg:order-2" : ""}`}><RemoteImage src={p.coverImage} alt={`${p.title} project screenshot`} sizes="(min-width: 1024px) 50vw, 100vw" /></div>}
                    <div className="flex flex-col p-8 md:p-12">
                      <p className="eyebrow">{p.category}</p>
                      <h2 className="t-h2 mt-4 !text-[length:var(--fs-h3)]">{p.title}</h2>
                      <p className="mt-4 text-lg">{p.description}</p>
                      <p className="muted mt-3 text-[0.95rem]">{p.longDesc}</p>
                      {p.outcome && <p className="mt-6 border-l-4 border-leaf pl-4 text-[0.95rem]"><span className="font-semibold">Outcome. </span>{p.outcome}</p>}
                      {p.tags.length > 0 && <ul className="mt-6 flex flex-wrap gap-2" aria-label="Engagement type">{p.tags.map((t) => <li key={t} className="chip">{t}</li>)}</ul>}
                      {p.url && <div className="mt-8"><ArrowButton href={p.url} external variant="outline-light" small>Visit platform</ArrowButton></div>}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {partners.length > 0 && (
        <section className="surface-light-2 section">
          <div className="container-wide">
            <SectionHeader eyebrow="Partner companies" title={<>Companies we&rsquo;ve <span className="accent-word">worked alongside.</span></>} />
            <Reveal className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {partners.map((p) => (
                <article key={p.id} data-reveal className="panel">
                  <p className="eyebrow">{p.category}</p>
                  <h3 className="t-h3 mt-3">{p.title}</h3>
                  <p className="muted mt-3 text-[0.95rem]">{p.description}</p>
                  {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="link-arrow mt-5 text-sm">{p.url.replace(/^https?:\/\//, "")}<span className="sr-only"> (opens in a new tab)</span></a>}
                </article>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {caseStudies.length === 0 && partners.length === 0 && (
        <section className="surface-light section"><div className="container-wide"><p className="muted text-lg">Case studies are being added. <Link className="link-arrow" href="/contact">Ask us about recent work</Link>.</p></div></section>
      )}

      <section className="surface-dark">
        <div className="container-wide section flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div><p className="eyebrow mb-5">Every engagement starts with a question</p><h2 className="t-h2 max-w-2xl">What does success <span className="accent-word">actually look like?</span></h2></div>
          <ArrowButton href="/contact">Start a conversation</ArrowButton>
        </div>
      </section>
    </>
  );
}
