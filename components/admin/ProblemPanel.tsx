import type { ReactNode } from "react";
import { WifiOff } from "lucide-react";

/** Friendly full-width panel for "the admin cannot load data" situations (offline, database down, crash). */
export default function ProblemPanel({ title, children, actions, detail }: { title: string; children: ReactNode; actions?: ReactNode; detail?: string }) {
  return (
    <div role="alert" className="mx-auto mt-10 max-w-2xl rounded-lg border border-ink-border bg-ink-light p-8 text-center">
      <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full border border-ink-border text-electric"><WifiOff size={24} aria-hidden /></span>
      <h1 className="font-display text-2xl font-bold text-snow">{title}</h1>
      <div className="mt-3 text-sm leading-relaxed text-mist">{children}</div>
      {actions && <div className="mt-7 flex flex-wrap items-center justify-center gap-3">{actions}</div>}
      {detail && (
        <details className="mt-7 text-left text-xs text-mist">
          <summary className="cursor-pointer text-center">Technical details</summary>
          <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-ink p-3 font-mono">{detail}</pre>
        </details>
      )}
    </div>
  );
}
