import type { ReactNode } from "react";

/** Shared shell for 404 / error screens: big status mark, headline, copy and actions. Always visible (no animation gating). */
export default function StatusPage({ code, eyebrow, title, children, actions, aside }: { code: string; eyebrow: string; title: ReactNode; children: ReactNode; actions: ReactNode; aside?: ReactNode }) {
  return (
    <section className="surface-dark relative overflow-hidden" aria-labelledby="status-title">
      <span aria-hidden className="pointer-events-none absolute -right-6 -top-6 select-none font-display font-extrabold leading-none text-transparent [-webkit-text-stroke:1.5px_rgba(127,220,138,0.22)] text-[clamp(10rem,32vw,28rem)]">{code}</span>
      <div className="container-wide relative py-24 md:py-36">
        <p className="eyebrow mb-8">{eyebrow}</p>
        <h1 id="status-title" className="t-h1 max-w-4xl">{title}</h1>
        <div className="t-lead mt-8 max-w-2xl text-[color:var(--on-dark-muted)]">{children}</div>
        <div className="mt-10 flex flex-wrap items-center gap-4">{actions}</div>
        {aside && <div className="mt-16 border-t border-[color:var(--line-dark)] pt-10">{aside}</div>}
      </div>
    </section>
  );
}
