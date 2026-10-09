import type { ReactNode } from "react";

export default function SectionHeader({ eyebrow, title, lead, action, className = "" }: { eyebrow?: string; title: ReactNode; lead?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-8 md:flex-row md:items-end md:justify-between ${className}`}>
      <div className="max-w-3xl">
        {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
        <h2 className="t-h2">{title}</h2>
        {lead && <p className="t-lead muted mt-6">{lead}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
