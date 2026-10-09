import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ArrowButton from "@/components/ui/ArrowButton";
import StatusPage from "@/components/ui/StatusPage";

export const metadata = { title: "Page not found", robots: { index: false, follow: false } };

const LINKS = [
  { href: "/services", title: "Services", body: "Registration, brand, websites and growth." },
  { href: "/pricing", title: "Pricing", body: "Packages and what each one includes." },
  { href: "/work", title: "Work", body: "Platforms we have planned and built." },
  { href: "/about", title: "About", body: "Who we are and how we work." },
  { href: "/blog", title: "Insights", body: "Articles on strategy and delivery." },
  { href: "/contact", title: "Contact", body: "Ask a question or request a quote." },
];

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      eyebrow="Error 404"
      title={<>We could not find <span className="accent-word">that page.</span></>}
      actions={<><ArrowButton href="/">Back to home</ArrowButton><ArrowButton href="/contact" variant="outline-dark">Tell us what you were after</ArrowButton></>}
      aside={
        <nav aria-label="Pages you might want">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.14em] text-leaf">Try one of these</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="group flex h-full items-start justify-between gap-4 rounded-2xl border border-[color:var(--line-dark)] p-5 transition-colors hover:border-leaf">
                  <span><span className="block font-display text-lg font-semibold">{l.title}</span><span className="mt-1 block text-sm text-[color:var(--on-dark-muted)]">{l.body}</span></span>
                  <ArrowUpRight size={18} aria-hidden className="mt-1 shrink-0 text-leaf transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      }
    >
      The link may be old or mistyped, or the page may have moved. These sections will get you back on track.
    </StatusPage>
  );
}
