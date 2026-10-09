import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

type Variant = "leaf" | "ink" | "outline-dark" | "outline-light";
export default function ArrowButton({ href, children, variant = "leaf", small = false, className = "", external = false }: { href: string; children: ReactNode; variant?: Variant; small?: boolean; className?: string; external?: boolean }) {
  const cls = `btn btn-${variant} ${small ? "btn-sm" : ""} ${className}`;
  const inner = <>{children}<span className="btn-arrow"><ArrowRight size={small ? 15 : 17} aria-hidden /></span></>;
  return external
    ? <a href={href} className={cls} target="_blank" rel="noopener noreferrer">{inner}<span className="sr-only"> (opens in a new tab)</span></a>
    : <Link href={href} className={cls}>{inner}</Link>;
}
