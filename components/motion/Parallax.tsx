"use client";
import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/** Decorative drift tied to scroll. Large screens + motion allowed only; aria-hidden, never carries content. */
export default function Parallax({ children, className, distance = -80 }: { children?: ReactNode; className?: string; distance?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.to(el, { y: distance, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top top", end: "bottom top", scrub: true } });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return <div ref={ref} className={className} aria-hidden="true">{children}</div>;
}
