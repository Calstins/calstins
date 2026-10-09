"use client";
import { useRef } from "react";
import { gsap, useGSAP, NO_REDUCED_MOTION } from "@/lib/gsap";

export interface TimelineItem { label?: string; title: string; body: string; bullets?: string[] }

/**
 * Vertical story/process timeline. A progress line fills as you scroll (scrub) and each step eases in.
 * Content is plain, ordered semantic markup; motion is purely additive.
 */
export default function StoryTimeline({ items, dark = false }: { items: TimelineItem[]; dark?: boolean }) {
  const root = useRef<HTMLOListElement>(null);
  const fill = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const list = root.current;
      if (!list) return;
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED_MOTION, () => {
        gsap.fromTo(fill.current, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: list, start: "top 65%", end: "bottom 65%", scrub: 0.4 } });
        gsap.utils.toArray<HTMLElement>("[data-step]", list).forEach((step) => {
          gsap.from(step, { autoAlpha: 0, y: 30, duration: 0.8, ease: "power3.out", clearProps: "opacity,visibility,transform", scrollTrigger: { trigger: step, start: "top 85%", once: true } });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const track = dark ? "bg-white/15" : "bg-[color:var(--line-light)]";
  return (
    <ol ref={root} className="relative">
      <span aria-hidden className={`absolute bottom-2 left-[0.95rem] top-2 w-px md:left-[7.45rem] ${track}`} />
      <span ref={fill} aria-hidden className="absolute bottom-2 left-[0.95rem] top-2 w-[3px] origin-top -translate-x-px rounded bg-leaf md:left-[7.45rem]" />
      {items.map((it, i) => (
        <li key={i} data-step className="relative grid gap-4 pb-14 pl-12 last:pb-0 md:grid-cols-[7rem_1fr] md:gap-12 md:pl-0">
          <div className="md:text-right">
            <span className={`font-display text-sm font-semibold uppercase tracking-[0.14em] ${dark ? "text-leaf" : "text-[color:var(--leaf-700)]"}`}>{it.label ?? String(i + 1).padStart(2, "0")}</span>
          </div>
          <span aria-hidden className={`absolute left-2 top-1 h-4 w-4 rounded-full border-2 md:left-[6.95rem] ${dark ? "border-leaf bg-ink" : "border-[color:var(--ink)] bg-[color:var(--paper)]"}`} />
          <div className="md:pl-10">
            <h3 className="t-h3">{it.title}</h3>
            <p className={`mt-3 measure leading-relaxed ${dark ? "text-[color:var(--on-dark-muted)]" : "muted"}`}>{it.body}</p>
            {it.bullets && it.bullets.length > 0 && (
              <ul className="mt-4 space-y-2 text-[0.95rem]">
                {it.bullets.map((b) => (
                  <li key={b} className="flex gap-3"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf" />{b}</li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
