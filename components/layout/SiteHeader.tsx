"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import ServiceIcon from "@/components/ui/ServiceIcon";
import Logo from "@/components/brand/Logo";
import { NAV_LINKS } from "@/lib/nav";

export type MenuGroup = { key: string; label: string; kicker: string; items: { slug: string; title: string; tagline: string; icon: string | null }[] };

export default function SiteHeader({ showPricing, menu = [] }: { showPricing: boolean; menu?: MenuGroup[] }) {
  const pathname = usePathname();
  // The menu is "open for" a specific pathname, so navigating anywhere closes it with no effect needed.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;
  const setOpen = useCallback((v: boolean | ((o: boolean) => boolean)) => {
    setOpenFor((cur) => {
      const next = typeof v === "function" ? v(cur === pathname) : v;
      return next ? pathname : null;
    });
  }, [pathname]);
  const [scrolled, setScrolled] = useState(false);
  // Mega menu: opens on hover/focus/click of "Services", closes on Esc, outside click or navigation.
  const [megaFor, setMegaFor] = useState<string | null>(null);
  const mega = megaFor === pathname && menu.length > 0;
  const megaRef = useRef<HTMLDivElement>(null);
  const megaTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const openMega = () => { clearTimeout(megaTimer.current); setMegaFor(pathname); };
  const closeMegaSoon = () => { clearTimeout(megaTimer.current); megaTimer.current = setTimeout(() => setMegaFor(null), 140); };
  const toggleRef = useRef<HTMLButtonElement>(null);
  const links = NAV_LINKS.filter((l) => !("optional" in l && l.optional) || showPricing);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    let raf = 0;
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setScrolled(window.scrollY > 8)); };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => { window.removeEventListener("scroll", on); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    if (!mega) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMegaFor(null); };
    const onDown = (e: MouseEvent) => { if (!megaRef.current?.contains(e.target as Node)) setMegaFor(null); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [mega]);

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, [setOpen]);

  // Modal-like behaviour while the mobile menu is open: Esc closes, background is inert + not scrollable.
  useEffect(() => {
    const content = document.getElementById("site-content");
    if (!open) { content?.removeAttribute("inert"); document.body.style.overflow = ""; return; }
    content?.setAttribute("inert", "");
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(true); };
    const onResize = () => { if (window.matchMedia("(min-width: 1024px)").matches) close(); };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => { document.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); content?.removeAttribute("inert"); document.body.style.overflow = ""; };
  }, [open, close]);

  return (
    <header className={`on-dark sticky top-0 z-50 bg-ink text-on-dark transition-[border-color,box-shadow] duration-300 ${scrolled || open ? "border-b border-white/10 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.6)]" : "border-b border-transparent"}`} style={{ color: "var(--on-dark)" }}>
      <div className="container-wide flex h-[4.5rem] items-center justify-between gap-6">
        <Link href="/" aria-label="Calstins Ltd home" className="block w-[10.5rem] shrink-0 md:w-[13rem]" onClick={() => setOpen(false)}>
          <Logo priority className="w-full" />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
          {links.map((l) => l.href === "/services" && menu.length > 0 ? (
            <div key={l.href} ref={megaRef} className="relative flex items-center gap-1" onMouseEnter={openMega} onMouseLeave={closeMegaSoon}
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) closeMegaSoon(); }} onFocus={openMega}>
              <Link href={l.href} className="nav-link" aria-current={isActive(l.href) ? "page" : undefined}>{l.label}</Link>
              <button type="button" aria-label="Show services menu" aria-expanded={mega} aria-controls="services-mega" onClick={() => setMegaFor(mega ? null : pathname)}
                className="grid h-7 w-7 place-items-center rounded-full text-[color:var(--on-dark-muted)] transition-colors hover:text-white">
                <ChevronDown size={16} aria-hidden className={`transition-transform duration-300 ${mega ? "rotate-180" : ""}`} />
              </button>
              <div id="services-mega" hidden={!mega}
                className="fixed inset-x-0 top-[4.5rem] border-b border-white/10 bg-ink shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)]">
                <div className="container-wide mega-in grid gap-10 py-10" style={{ gridTemplateColumns: `repeat(${Math.min(menu.length, 4)}, minmax(0, 1fr))` }}>
                  {menu.map((g) => (
                    <div key={g.key}>
                      <p className="eyebrow">{g.label}</p>
                      <p className="mt-1 text-sm text-[color:var(--on-dark-muted)]">{g.kicker}</p>
                      <ul className="mt-5 space-y-1">
                        {g.items.map((s) => (
                          <li key={s.slug}>
                            <Link href={`/services/${s.slug}`} onClick={() => setMegaFor(null)} className="group flex gap-3 rounded-xl p-2.5 transition-colors hover:bg-white/5 focus-visible:bg-white/5">
                              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-leaf transition-colors group-hover:border-leaf/50"><ServiceIcon name={s.icon} size={18} /></span>
                              <span className="min-w-0">
                                <span className="block text-[0.95rem] font-semibold text-white">{s.title}</span>
                                <span className="line-clamp-2 block text-[0.82rem] leading-snug text-[color:var(--on-dark-muted)]">{s.tagline}</span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10">
                  <div className="container-wide flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
                    <Link href="/services" onClick={() => setMegaFor(null)} className="font-semibold text-leaf hover:underline">View all services →</Link>
                    {showPricing && <Link href="/pricing" onClick={() => setMegaFor(null)} className="text-[color:var(--on-dark-muted)] hover:text-white">See packages and pricing</Link>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Link key={l.href} href={l.href} className="nav-link" aria-current={isActive(l.href) ? "page" : undefined}>{l.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/contact" className="btn btn-leaf btn-sm hidden sm:inline-flex" aria-current={isActive("/contact") ? "page" : undefined}>
            Start a project <span className="btn-arrow"><ArrowRight size={15} aria-hidden /></span>
          </Link>
          <button
            ref={toggleRef}
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition-colors hover:border-leaf lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile panel: always in the DOM, inert + invisible while closed so it is never tabbable. */}
      <div
        id="mobile-nav"
        inert={!open}
        className={`fixed inset-x-0 bottom-0 top-[4.5rem] overflow-y-auto bg-ink transition-[opacity,transform] duration-300 ease-out lg:hidden ${open ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"}`}
        style={{ visibility: open ? "visible" : "hidden", transitionProperty: "opacity, transform, visibility" }}
      >
        <nav aria-label="Mobile" className="container-wide flex min-h-full flex-col justify-between gap-10 py-8">
          <ul className="divide-y divide-white/10 border-y border-white/10">
            {links.map((l, i) => (
              <li key={l.href} style={{ transitionDelay: open ? `${60 + i * 45}ms` : "0ms" }} className={`transition-all duration-500 ${open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
                <Link href={l.href} aria-current={isActive(l.href) ? "page" : undefined} className="flex items-center justify-between py-5 font-display text-3xl font-semibold tracking-tight aria-[current=page]:text-leaf">
                  {l.label}<ArrowRight size={22} aria-hidden className="text-white/40" />
                </Link>
                {l.href === "/services" && menu.length > 0 && (
                  <details className="group mb-5 pl-1">
                    <summary className="flex cursor-pointer list-none items-center gap-2 py-1 text-sm font-medium text-leaf [&::-webkit-details-marker]:hidden">
                      Browse all services <ChevronDown size={16} aria-hidden className="transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="mt-3 space-y-4">
                      {menu.map((g) => (
                        <div key={g.key}>
                          <p className="eyebrow">{g.label}</p>
                          <ul className="mt-2 text-[0.95rem] text-[color:var(--on-dark-muted)]">
                            {g.items.map((s) => <li key={s.slug}><Link href={`/services/${s.slug}`} className="block py-1.5 hover:text-leaf">{s.title}</Link></li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </li>
            ))}
          </ul>
          <Link href="/contact" className="btn btn-leaf w-full">Start a project <span className="btn-arrow"><ArrowRight size={16} aria-hidden /></span></Link>
        </nav>
      </div>
    </header>
  );
}
