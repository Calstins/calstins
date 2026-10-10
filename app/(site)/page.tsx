import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Intro from "@/components/motion/Intro";
import Reveal from "@/components/motion/Reveal";
import AgencyScene from "@/components/motion/AgencyScene";
import StoryTimeline from "@/components/motion/StoryTimeline";
import ArrowButton from "@/components/ui/ArrowButton";
import SectionHeader from "@/components/ui/SectionHeader";
import FaqList from "@/components/ui/FaqList";
import RemoteImage from "@/components/ui/RemoteImage";
import { COMPARISON, HERO, PHASES } from "@/lib/content";
import { getEngagementModes, getFeaturedClients, getFeaturedProjects, getFeaturedTestimonials, getPublishedFaqs, getPublishedServices } from "@/lib/data";
import { getPublicSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = { ...pageMetadata({ title: "Calstins Ltd — Technology Advisory & Delivery in Nigeria", description: "We plan it, build it, and stay. Calstins is a technology advisory and delivery firm in Abuja, Nigeria: strategy, IT consulting, software delivery and long-term partnership.", path: "/" }), title: { absolute: "Calstins Ltd — Technology Advisory & Delivery in Nigeria" } };

export default async function HomePage() {
  const [allServices, featuredServices, modes, projects, testimonials, clients, faqs, settings] = await Promise.all([
    getPublishedServices(), getPublishedServices({ featuredOnly: true }), getEngagementModes(), getFeaturedProjects(3), getFeaturedTestimonials(), getFeaturedClients(), getPublishedFaqs(), getPublicSettings(),
  ]);
  const services = (featuredServices.length ? featuredServices : allServices).slice(0, 6);
  const generalFaqs = faqs.filter((f) => !f.serviceId).slice(0, 5);
  const [lead, ...restProjects] = projects;

  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="surface-dark relative isolate overflow-hidden">
        {/* WebGL scene: the globe sits behind the right column, the particle field and ribbons span the whole hero. */}
        <AgencyScene className="absolute inset-0 -z-10 h-full w-full" />
        <Intro className="container-wide relative z-10 grid gap-16 pb-24 pt-20 md:pb-32 md:pt-28 lg:grid-cols-[1.45fr_1fr] lg:items-center lg:gap-10">
          <div>
            <p data-anim className="eyebrow mb-8">{HERO.eyebrow}</p>
            <h1 data-anim data-split className="t-display">
              {HERO.lines[0]}{" "}<br />{HERO.lines[1]}{" "}<br /><span className="accent-word">{HERO.lines[2]}</span>
            </h1>
            <p data-anim className="t-lead mt-10 text-[color:var(--on-dark-muted)]">{HERO.lead}</p>
            <div data-anim className="mt-10 flex flex-wrap gap-4">
              <ArrowButton href="/contact">Book a discovery call</ArrowButton>
              <ArrowButton href="/work" variant="outline-dark">See our work</ArrowButton>
            </div>
          </div>

          <div data-scene-anchor className="relative grid min-h-[20rem] place-items-center sm:min-h-[26rem] lg:min-h-[34rem]">
            {modes.length > 0 && (
            <ol data-anim className="steps-glow relative w-fit max-w-full space-y-0 border-l border-white/15 pl-8" aria-label="How an engagement progresses">
              {modes.map((m, i) => (
                <li key={m.id} className="step-item relative pb-9 last:pb-0" style={{ ["--i" as string]: i }}>
                  <span aria-hidden className="step-dot absolute -left-[2.45rem] top-1.5 h-3 w-3 rounded-full bg-leaf ring-4 ring-[color:var(--ink)]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-leaf">{m.number}</p>
                  <p className="mt-1 font-display text-xl font-semibold tracking-tight">{m.title}</p>
                  <p className="mt-1 text-sm text-[color:var(--on-dark-muted)]">{m.tag}</p>
                </li>
              ))}
            </ol>
            )}
          </div>
        </Intro>
      </section>

      {/* ───────── Proof strip: verified client names only ───────── */}
      {clients.length > 0 && (
        <section className="surface-light-2 border-b border-[color:var(--line-light)]" aria-label="Organisations we have worked with">
          <div className="container-wide flex flex-col gap-4 py-8 md:flex-row md:items-center md:gap-10">
            <p className="eyebrow shrink-0">Worked with</p>
            <ul className="flex flex-wrap gap-x-10 gap-y-3 font-display text-xl font-semibold tracking-tight">
              {clients.map((c) => <li key={c.id}>{c.url ? <a href={c.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{c.name}<span className="sr-only"> (opens in a new tab)</span></a> : c.name}</li>)}
            </ul>
          </div>
        </section>
      )}

      {/* ───────── How we engage (admin: Engagement modes) ───────── */}
      {modes.length > 0 && (
        <section className="surface-light section">
          <div className="container-wide">
            <SectionHeader eyebrow="How we engage" title={<>Three ways to work <span className="accent-word">with Calstins.</span></>} lead="Start with a fixed-scope discovery, take us through the build, or keep us on as the partner that stays." />
            <Reveal className="mt-16 grid gap-5 lg:grid-cols-3">
              {modes.map((m) => (
                <article key={m.id} data-reveal className="panel flex flex-col">
                  <p className="font-display text-6xl font-bold leading-none tracking-tighter text-[color:var(--ink)]/15">{m.number}</p>
                  <h3 className="t-h3 mt-6">{m.title}</h3>
                  <p className="muted mt-3">{m.description}</p>
                  <ul className="mt-6 space-y-2.5 text-[0.95rem]">
                    {m.bullets.map((b) => <li key={b} className="flex gap-3"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--leaf-deep)]" />{b}</li>)}
                  </ul>
                  <p className="chip mt-auto self-start" style={{ marginTop: "2rem" }}>{m.tag}</p>
                </article>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {/* ───────── Services (admin: Services, published + featured) ───────── */}
      {services.length > 0 && (
        <section className="surface-dark section">
          <div className="container-wide">
            <SectionHeader eyebrow="What we deliver" title={<>One integrated <span className="accent-word">partner.</span></>} lead="Every engagement draws on all of these disciplines at once. You do not pick a service; you get a partner who brings the right ones to the table."
              action={<ArrowButton href="/services" variant="outline-dark">All services</ArrowButton>} />
            <Reveal as="ul" className="mt-16 border-t border-white/15" stagger={0.07}>
              {services.map((s) => (
                <li key={s.id} data-reveal className="border-b border-white/15">
                  <Link href={`/services/${s.slug}`} className="group grid items-center gap-3 py-8 md:grid-cols-[5rem_1.1fr_1.4fr_auto] md:gap-8">
                    <span className="font-display text-sm font-semibold tracking-[0.14em] text-leaf">{s.areaNumber}</span>
                    <span className="font-display text-3xl font-semibold tracking-tight transition-transform duration-500 ease-out group-hover:translate-x-2 md:text-4xl">{s.title}</span>
                    <span className="text-[color:var(--on-dark-muted)]">{s.tagline}</span>
                    <ArrowUpRight aria-hidden className="hidden text-leaf transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 md:block" size={28} />
                  </Link>
                </li>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {/* ───────── Selected work ───────── */}
      {lead && (
        <section className="surface-light section">
          <div className="container-wide">
            <SectionHeader eyebrow="Selected work" title={<>Work that <span className="accent-word">speaks for itself.</span></>} action={<ArrowButton href="/work" variant="outline-light">All work</ArrowButton>} />
            <Reveal className="mt-16 grid gap-5 lg:grid-cols-12">
              <article data-reveal className={`panel flex flex-col overflow-hidden !p-0 ${restProjects.length ? "lg:col-span-7" : "lg:col-span-12"}`}>
                {lead.coverImage && <div className="relative aspect-[16/10] w-full bg-[color:var(--paper-2)]"><RemoteImage src={lead.coverImage} alt={`${lead.title} project screenshot`} sizes="(min-width: 1024px) 58vw, 100vw" /></div>}
                <div className="p-8 md:p-10">
                  <p className="eyebrow">{lead.category}</p>
                  <h3 className="t-h2 mt-4 !text-[length:var(--fs-h3)]">{lead.title}</h3>
                  <p className="muted mt-3 measure">{lead.description}</p>
                  <p className="mt-6 border-l-4 border-leaf pl-4 text-[0.95rem]"><span className="font-semibold">Outcome. </span>{lead.outcome}</p>
                </div>
              </article>
              {restProjects.length > 0 && (
                <div className="grid gap-5 lg:col-span-5">
                  {restProjects.map((p) => (
                    <article key={p.id} data-reveal className="panel">
                      <p className="eyebrow">{p.category}</p>
                      <h3 className="t-h3 mt-3">{p.title}</h3>
                      <p className="muted mt-2 text-[0.95rem]">{p.description}</p>
                    </article>
                  ))}
                </div>
              )}
            </Reveal>
          </div>
        </section>
      )}

      {/* ───────── The Calstins difference (existing positioning copy) ───────── */}
      <section className="surface-light-2 section">
        <div className="container-wide">
          <SectionHeader eyebrow="The Calstins difference" title={<>Two types of firms. <span className="accent-word">Neither is enough.</span></>} />
          <Reveal className="mt-16" self>
            <table className="hidden w-full border-collapse text-left md:table">
              <caption className="sr-only">How Calstins compares with a traditional consultant and a development agency</caption>
              <thead>
                <tr className="border-b-2 border-[color:var(--ink)]">
                  <td className="w-44 py-4" />
                  {COMPARISON.columns.map((c, i) => <th key={c} scope="col" className={`px-5 py-4 font-display text-lg font-semibold ${i === 2 ? "rounded-t-xl bg-[color:var(--ink)] text-leaf" : ""}`}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.rows.map(([label, a, b, c]) => (
                  <tr key={label} className="border-b border-[color:var(--line-light)]">
                    <th scope="row" className="py-5 pr-4 font-display text-lg font-semibold">{label}</th>
                    <td className="muted px-5 py-5">{a}</td><td className="muted px-5 py-5">{b}</td>
                    <td className="bg-[color:var(--ink)] px-5 py-5 font-medium text-[color:var(--on-dark)]">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="space-y-4 md:hidden">
              {COMPARISON.rows.map(([label, a, b, c]) => (
                <dl key={label} className="panel !p-5">
                  <dt className="font-display text-xl font-semibold">{label}</dt>
                  <dd className="muted mt-3 text-sm"><span className="font-semibold text-[color:var(--text)]">{COMPARISON.columns[0]}: </span>{a}</dd>
                  <dd className="muted mt-2 text-sm"><span className="font-semibold text-[color:var(--text)]">{COMPARISON.columns[1]}: </span>{b}</dd>
                  <dd className="mt-3 rounded-lg bg-[color:var(--ink)] p-3 text-sm text-[color:var(--on-dark)]"><span className="font-semibold text-leaf">{COMPARISON.columns[2]}: </span>{c}</dd>
                </dl>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── Process ───────── */}
      <section className="surface-dark section">
        <div className="container-wide grid gap-16 lg:grid-cols-[1fr_1.4fr]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="eyebrow mb-5">How an engagement works</p>
            <h2 className="t-h2">Four phases. <span className="accent-word">One relationship.</span></h2>
            <p className="t-lead mt-6 text-[color:var(--on-dark-muted)]">From the first question about your business model to the roadmap that follows launch.</p>
            <div className="mt-10"><ArrowButton href="/about">Our approach</ArrowButton></div>
          </div>
          <StoryTimeline dark items={PHASES.map((p) => ({ label: p.num, title: p.title, body: p.desc, bullets: p.items }))} />
        </div>
      </section>

      {/* ───────── Testimonials: only real ones from the admin ───────── */}
      {testimonials.length > 0 && (
        <section className="surface-light section">
          <div className="container-wide">
            <SectionHeader eyebrow="In their words" title={<>What clients <span className="accent-word">say.</span></>} />
            <Reveal as="ul" className="mt-16 grid gap-5 md:grid-cols-2">
              {testimonials.map((t) => (
                <li key={t.id} data-reveal className="panel">
                  <figure>
                    <blockquote className="font-display text-2xl font-medium leading-snug tracking-tight">“{t.quote}”</blockquote>
                    <figcaption className="mt-6 text-sm"><span className="font-semibold">{t.name}</span><span className="muted">, {t.role}, {t.company}</span></figcaption>
                  </figure>
                </li>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {/* ───────── FAQ preview ───────── */}
      {generalFaqs.length > 0 && (
        <section className="surface-light-2 section">
          <div className="container-wide grid gap-14 lg:grid-cols-[1fr_1.6fr]">
            <div><p className="eyebrow mb-5">Questions</p><h2 className="t-h2">Before you <span className="accent-word">get in touch.</span></h2></div>
            <FaqList items={generalFaqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }))} />
          </div>
        </section>
      )}

      {/* ───────── Final CTA ───────── */}
      <section className="bg-leaf text-[color:var(--ink)]">
        <div className="container-wide section grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <Reveal self>
            <h2 className="t-h1 !text-[length:var(--fs-h2)]">{settings.contactCtaTitle || "Every engagement starts with a question: what does success actually look like?"}</h2>
            <p className="mt-6 max-w-xl text-lg">{settings.contactCtaBody || "We don't take on engagements we can't deliver. Before any work begins, we align on outcomes, constraints, and what we'll need from each other."}</p>
          </Reveal>
          <div className="flex flex-wrap gap-4 lg:justify-end">
            <ArrowButton href="/contact" variant="ink">Start a conversation</ArrowButton>
          </div>
        </div>
      </section>
    </>
  );
}
