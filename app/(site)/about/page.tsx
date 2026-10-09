import Intro from "@/components/motion/Intro";
import Reveal from "@/components/motion/Reveal";
import StoryTimeline from "@/components/motion/StoryTimeline";
import ArrowButton from "@/components/ui/ArrowButton";
import SectionHeader from "@/components/ui/SectionHeader";
import { ORIGIN_PARAGRAPHS, PHASES, POSITION, PRINCIPLES } from "@/lib/content";
import { getPublicSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "About — Calstins Ltd",
  description: "Calstins was built at the intersection of strategy and execution, the gap where technology initiatives fail.",
  path: "/about",
});

export default async function AboutPage() {
  const s = await getPublicSettings();
  // The owner's DB-edited story replaces the built-in copy only once they publish it.
  const custom = s.storyPublished && !!s.storyBody;
  const paragraphs = custom ? (s.storyBody as string).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) : ORIGIN_PARAGRAPHS;
  const milestones = custom ? s.milestones : [];
  const values = custom && s.values.length ? s.values.map((v, i) => ({ num: String(i + 1).padStart(2, "0"), title: v.title, desc: v.body })) : PRINCIPLES;
  const place = [s.addressLine, s.city, s.country].filter(Boolean).join(", ");

  return (
    <>
      <section className="surface-dark">
        <Intro className="container-wide pb-20 pt-20 md:pb-28 md:pt-28">
          <p data-anim className="eyebrow mb-8">About the firm</p>
          <h1 data-anim data-split className="t-h1 max-w-5xl">Built at the intersection{" "}<br />of <span className="accent-word">strategy and execution.</span></h1>
          <p data-anim className="t-lead mt-8 text-[color:var(--on-dark-muted)]">Calstins was founded on the observation that the gap between thinking and building is where technology initiatives fail. We exist to close that gap.</p>
        </Intro>
      </section>

      <section className="surface-light section">
        <div className="container-wide grid gap-14 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow mb-5">{custom ? "Our story" : "Origin"}</p>
            {custom && s.storyHeadline
              ? <h2 className="t-h2">{s.storyHeadline}</h2>
              : <blockquote className="t-h2">&ldquo;We built the first engagement for a client who needed <span className="accent-word">everything.</span> They asked us to stay. That became Calstins.&rdquo;</blockquote>}
          </div>
          <Reveal className="space-y-6 text-lg leading-relaxed">
            {paragraphs.map((p, i) => <p key={i} data-reveal className="measure">{p}</p>)}
            {s.mission && <p data-reveal className="measure border-l-4 border-leaf pl-5 font-display text-2xl font-medium leading-snug tracking-tight">{s.mission}</p>}
          </Reveal>
        </div>
      </section>

      {milestones.length > 0 && (
        <section className="surface-light-2 section">
          <div className="container-wide">
            <SectionHeader eyebrow="Our journey" title={<>How Calstins has <span className="accent-word">evolved.</span></>} />
            <div className="mt-16"><StoryTimeline items={milestones.map((m) => ({ label: m.label || undefined, title: m.title, body: m.body }))} /></div>
          </div>
        </section>
      )}

      <section className="surface-dark section">
        <div className="container-wide">
          <SectionHeader eyebrow="How we work" title={<>Principles that drive <span className="accent-word">every engagement.</span></>} />
          <Reveal className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {values.map((p) => (
              <article key={p.num} data-reveal className="panel-dark">
                <p className="font-display text-5xl font-bold tracking-tighter text-leaf/35">{p.num}</p>
                <h3 className="t-h3 mt-5">{p.title}</h3>
                <p className="mt-3 text-[color:var(--on-dark-muted)]">{p.desc}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="surface-light section">
        <div className="container-wide">
          <SectionHeader eyebrow="Our approach" title={<>Four phases. <span className="accent-word">One relationship.</span></>} />
          <div className="mt-16"><StoryTimeline items={PHASES.map((p) => ({ label: p.num, title: p.title, body: p.desc, bullets: p.items }))} /></div>
        </div>
      </section>

      <section className="surface-light-2 section">
        <div className="container-wide grid gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="eyebrow mb-5">Company details</p>
            <h2 className="t-h2">{POSITION.title}</h2>
            <p className="muted mt-6 measure text-lg">{POSITION.body}</p>
          </div>
          <dl className="panel grid h-fit gap-5 text-[0.95rem] sm:grid-cols-2">
            <div><dt className="muted text-xs font-semibold uppercase tracking-[0.14em]">Company</dt><dd className="mt-1 font-semibold">{s.legalName || s.companyName}</dd></div>
            <div><dt className="muted text-xs font-semibold uppercase tracking-[0.14em]">Registration number</dt><dd className="mt-1 font-semibold">{s.registrationNumber ?? "Available on request"}</dd></div>
            {place && <div><dt className="muted text-xs font-semibold uppercase tracking-[0.14em]">Location</dt><dd className="mt-1 font-semibold">{place}</dd></div>}
            <div><dt className="muted text-xs font-semibold uppercase tracking-[0.14em]">Email</dt><dd className="mt-1 font-semibold"><a className="underline underline-offset-4" href={`mailto:${s.publicEmail}`}>{s.publicEmail}</a></dd></div>
          </dl>
        </div>
      </section>

      <section className="bg-leaf text-[color:var(--ink)]">
        <div className="container-wide section flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <h2 className="t-h2 max-w-2xl">Start a conversation.</h2>
          <div className="flex flex-wrap gap-4"><ArrowButton href="/contact" variant="ink">Get in touch</ArrowButton><ArrowButton href="/services" variant="outline-light">View services</ArrowButton></div>
        </div>
      </section>
    </>
  );
}
