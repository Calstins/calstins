"use client";
import { useRef } from "react";
import { gsap, NO_REDUCED_MOTION, useGSAP } from "@/lib/gsap";

// A template re-mounts on every client-side navigation (a layout does not), which gives us a brief,
// restrained fade/slide of the page CONTENT. There is no overlay, so nothing can get stuck, and the
// first page load is never animated (SSR content is already visible: no flash, no delay).
let firstMount = true;

export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (firstMount) { firstMount = false; return; }
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED_MOTION, () => {
        gsap.fromTo(
          ref.current,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out", clearProps: "opacity,visibility,transform" },
        );
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return <div ref={ref}>{children}</div>;
}
