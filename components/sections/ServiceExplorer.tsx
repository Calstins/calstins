"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ServiceIcon from "@/components/ui/ServiceIcon";
import { Flip, gsap, useGSAP, NO_REDUCED_MOTION } from "@/lib/gsap";

export interface ExplorerService {
  id: string; slug: string; title: string; tagline: string; icon: string | null; group: string; groupLabel: string; scope: string[]; timeline: string | null; number: string;
}
export interface ExplorerGroup { key: string; label: string }

/**
 * Filterable service grid. Filtering uses GSAP Flip so cards glide to their new positions instead of jumping.
 * Filter buttons stay mounted (keyboard focus is never lost); filtered-out cards are display:none (not focusable).
 */
export default function ServiceExplorer({ services, groups }: { services: ExplorerService[]; groups: ExplorerGroup[] }) {
  const [filter, setFilter] = useState("all");
  const grid = useRef<HTMLUListElement>(null);
  const pending = useRef<Flip.FlipState | null>(null);
  const shown = services.filter((s) => filter === "all" || s.group === filter);

  const choose = (key: string) => {
    if (key === filter) return;
    const cards = grid.current ? gsap.utils.toArray<HTMLElement>("[data-card]", grid.current) : [];
    pending.current = cards.length ? Flip.getState(cards) : null;
    setFilter(key);
  };

  useGSAP(
    () => {
      const state = pending.current;
      if (!state) return;
      pending.current = null;
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED_MOTION, () => {
        Flip.from(state, {
          duration: 0.6, ease: "power3.inOut", stagger: 0.035, absolute: true, nested: true,
          onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power3.out", clearProps: "opacity,visibility,transform" }),
          onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.94, duration: 0.3, ease: "power2.in" }),
        });
      });
    },
    { dependencies: [filter], scope: grid },
  );

  return (
    <div>
      {groups.length > 1 && (
        <div role="group" aria-label="Filter services by stage" className="mb-10 flex flex-wrap gap-3">
          {[{ key: "all", label: "All services" }, ...groups].map((g) => (
            <button key={g.key} type="button" aria-pressed={filter === g.key} onClick={() => choose(g.key)}
              className={`rounded-full border px-5 py-2.5 text-[0.95rem] font-semibold transition-colors ${filter === g.key ? "border-[color:var(--ink)] bg-[color:var(--ink)] text-[color:var(--paper)]" : "border-[color:var(--ink)]/30 hover:border-[color:var(--ink)]"}`}>
              {g.label}
            </button>
          ))}
        </div>
      )}
      <p className="sr-only" role="status" aria-live="polite">Showing {shown.length} {shown.length === 1 ? "service" : "services"}</p>

      <ul ref={grid} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((s) => {
          const visible = filter === "all" || s.group === filter;
          return (
            <li key={s.id} data-card className={visible ? "" : "hidden"}>
              <Link href={`/services/${s.slug}`} className="panel group flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--ink)] text-leaf"><ServiceIcon name={s.icon} /></span>
                  <ArrowUpRight aria-hidden className="text-[color:var(--ink)]/50 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" />
                </div>
                <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--leaf-700)]">{s.number} · {s.groupLabel}</p>
                <h3 className="t-h3 mt-2">{s.title}</h3>
                <p className="muted mt-3">{s.tagline}</p>
                {s.scope.length > 0 && (
                  <ul className="mt-6 space-y-2 border-t border-[color:var(--line-light)] pt-5 text-sm">
                    {s.scope.slice(0, 3).map((b) => <li key={b} className="flex gap-3"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--leaf-deep)]" />{b}</li>)}
                  </ul>
                )}
                {s.timeline && <p className="muted mt-auto pt-6 text-sm">Typical timeline: {s.timeline}</p>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
