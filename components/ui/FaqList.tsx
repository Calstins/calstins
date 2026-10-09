"use client";
import { useId, useState } from "react";
import { Plus } from "lucide-react";

export interface FaqItem { id: string; question: string; answer: string }

/** Accessible accordion: real buttons with aria-expanded/controls. Height animates with the CSS grid-rows trick (no layout thrash). */
export default function FaqList({ items, dark = false }: { items: FaqItem[]; dark?: boolean }) {
  const base = useId();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className={`divide-y border-y ${dark ? "divide-white/15 border-white/15" : "divide-[color:var(--line-light)] border-[color:var(--line-light)]"}`}>
      {items.map((f) => {
        const isOpen = open === f.id;
        const panelId = `${base}-${f.id}-panel`;
        const btnId = `${base}-${f.id}-btn`;
        return (
          <div key={f.id}>
            <h3>
              <button id={btnId} type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => setOpen(isOpen ? null : f.id)} className="flex w-full items-center justify-between gap-6 py-6 text-left font-display text-xl font-semibold tracking-tight md:text-2xl">
                <span>{f.question}</span>
                <span aria-hidden className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-transform duration-500 ease-out ${isOpen ? "rotate-45" : ""} ${dark ? "border-white/30" : "border-[color:var(--ink)]"}`}><Plus size={18} /></span>
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={btnId} inert={!isOpen} className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden"><p className={`measure pb-7 leading-relaxed ${dark ? "text-[color:var(--on-dark-muted)]" : "muted"}`}>{f.answer}</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
