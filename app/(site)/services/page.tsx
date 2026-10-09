import Link from "next/link";
import Intro from "@/components/motion/Intro";
import Reveal from "@/components/motion/Reveal";
import ArrowButton from "@/components/ui/ArrowButton";
import SectionHeader from "@/components/ui/SectionHeader";
import ServiceExplorer, { type ExplorerService } from "@/components/sections/ServiceExplorer";
import { getEngagementModes, getPublishedPackages, getPublishedServices, groupByStage } from "@/lib/data";
import { STAGES, isStageKey } from "@/lib/stages";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = pageMetadata({
  title: "Services — Full-lifecycle Advisory and Delivery",
  description: "Technology strategy, IT consulting and networking, software delivery and long-term partnership for Nigerian organisations.",
  path: "/services",
});

export default async function ServicesPage() {
  const [services, modes, packages] = await Promise.all([getPublishedServices(), getEngagementModes(), getPublishedPackages()]);
  const groups = groupByStage(services);
  const labelFor = new Map(groups.map((g) => [g.key as string, g.label]));
  const explorer: ExplorerService[] = groups.flatMap((g) =>
    g.items.map((s) => ({
      id: s.id, slug: s.slug, title: s.title, tagline: s.tagline, icon: s.icon ?? null, group: g.key, groupLabel: labelFor.get(g.key) ?? "",
      scope: s.scope?.length ? s.scope : s.subItems.map((i) => i.heading), timeline: s.deliveryTimeline ?? null, number: s.areaNumber,
    })),
  );
  const stagedKeys = groups.map((g) => g.key).filter(isStageKey);

  return (
    <>
      <section className="surface-dark">
        <Intro className="container-wide pb-20 pt-20 md:pb-28 md:pt-28">
          <p data-anim className="eyebrow mb-8">What we do</p>
          <h1 data-anim data-split className="t-h1 max-w-5xl">Full-lifecycle advisory{" "}<br /><span className="accent-word">and build.</span></h1>
          <p data-anim className="t-lead mt-8 text-[color:var(--on-dark-muted)]">From the first strategic question to the last deployment, and everything that comes after. One firm, one relationship, no handoffs.</p>
          {packages.length > 0 && <div data-anim className="mt-10"><ArrowButton href="/pricing">See packages and pricing</ArrowButton></div>}
        </Intro>
      </section>

      {stagedKeys.length > 0 && (
        <section className="surface-light-2 border-b border-[color:var(--line-light)]">
          <Reveal className="container-wide grid gap-8 py-14 md:grid-cols-3">
            {stagedKeys.map((k, i) => (
              <div key={k} data-reveal>
                <p className="font-display text-5xl font-bold tracking-tighter text-[color:var(--ink)]/15">{String(i + 1).padStart(2, "0")}</p>
                <h2 className="t-h3 mt-3">{STAGES[k].label}: <span className="muted font-medium">{STAGES[k].kicker}</span></h2>
                <p className="muted mt-2">{STAGES[k].intro}</p>
              </div>
            ))}
          </Reveal>
        </section>
      )}

      <section className="surface-light section">
        <div className="container-wide">
          {explorer.length > 0 ? (
            <ServiceExplorer services={explorer} groups={groups.map((g) => ({ key: g.key, label: g.label }))} />
          ) : (
            <p className="muted text-lg">Our service list is being updated. <Link className="link-arrow" href="/contact">Tell us what you need</Link> and we will point you to the right engagement.</p>
          )}
        </div>
      </section>

      {modes.length > 0 && (
        <section className="surface-dark section">
          <div className="container-wide">
            <SectionHeader eyebrow="How we engage" title={<>Three ways to work <span className="accent-word">with Calstins.</span></>} />
            <Reveal className="mt-16 grid gap-5 lg:grid-cols-3">
              {modes.map((m) => (
                <article key={m.id} data-reveal className="panel-dark flex flex-col">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-leaf">Engagement mode {m.number}</p>
                  <h3 className="t-h3 mt-3">{m.title}</h3>
                  <p className="mt-3 text-[color:var(--on-dark-muted)]">{m.description}</p>
                  <ul className="mt-6 space-y-2.5 text-[0.95rem]">{m.bullets.map((b) => <li key={b} className="flex gap-3"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf" />{b}</li>)}</ul>
                  <p className="chip mt-auto self-start" style={{ marginTop: "2rem" }}>{m.tag}</p>
                </article>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      <section className="bg-leaf text-[color:var(--ink)]">
        <div className="container-wide section flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div><h2 className="t-h2 max-w-2xl">Ready to build something that lasts?</h2><p className="mt-5 max-w-xl text-lg">Tell us about your programme and we will propose the right engagement structure.</p></div>
          <ArrowButton href="/contact" variant="ink">Start a conversation</ArrowButton>
        </div>
      </section>
    </>
  );
}
