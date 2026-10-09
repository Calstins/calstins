"use client";
import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP, NO_REDUCED_MOTION } from "@/lib/gsap";

/**
 * Scroll-triggered, staggered entrance for a group. Children opt in with `data-reveal`
 * (or pass `self` to animate the wrapper itself). Triggers once. SSR output is fully visible: the hidden
 * state is only applied client-side to content that is below the fold, so nothing depends on JS to be readable.
 */
export default function Reveal({ children, className, as, self = false, y = 28, stagger = 0.09, start = "top 88%" }: {
  children: ReactNode; className?: string; as?: ElementType; self?: boolean; y?: number; stagger?: number; start?: string;
}) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED_MOTION, () => {
        const targets = self ? [root] : gsap.utils.toArray<HTMLElement>("[data-reveal]", root);
        if (!targets.length) return;
        gsap.from(targets, {
          autoAlpha: 0, y, duration: 0.85, ease: "power3.out", stagger,
          clearProps: "opacity,visibility,transform",
          scrollTrigger: { trigger: root, start, once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return <Tag ref={ref} className={className}>{children}</Tag>;
}
