"use client";
import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, SplitText, useGSAP, NO_REDUCED_MOTION, REDUCED_MOTION } from "@/lib/gsap";

/**
 * Above-the-fold entrance sequence for a hero / page intro.
 *
 *  - Children opt in with `data-anim`. CSS hides them only when JS is on and motion is allowed, and a CSS
 *    failsafe reveals them after 3s regardless, so content can never stay hidden.
 *  - ONE child may also carry `data-split` (the headline): it is revealed line by line with SplitText.
 *    SplitText keeps the heading readable to assistive tech (aria-label on the heading, split lines aria-hidden).
 *  - Reduced motion: everything is simply shown.
 */
export default function Intro({ children, className, as }: { children: ReactNode; className?: string; as?: ElementType }) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const all = gsap.utils.toArray<HTMLElement>("[data-anim]", root);
      const split = root.querySelector<HTMLElement>("[data-split]");
      const rest = all.filter((el) => el !== split);
      const mm = gsap.matchMedia();

      mm.add(NO_REDUCED_MOTION, () => {
        let cancelled = false;
        let splitter: SplitText | undefined;
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        const start = () => {
          if (cancelled) return;
          if (split) {
            gsap.set(split, { autoAlpha: 1 });
            splitter = SplitText.create(split, {
              type: "lines",
              mask: "lines",
              maskClass: "split-mask",
              autoSplit: true, // re-split (and keep progress) when the viewport changes the line breaks
              onSplit: (self) => gsap.from(self.lines, { yPercent: 115, duration: 1.05, stagger: 0.12, ease: "power4.out" }),
            });
          }
          tl.fromTo(rest, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1, clearProps: "transform" }, split ? 0.45 : 0);
        };
        // Measure line breaks only after the webfont has loaded.
        (document.fonts?.ready ?? Promise.resolve()).then(start, start);

        return () => { cancelled = true; tl.kill(); splitter?.revert(); };
      });

      mm.add(REDUCED_MOTION, () => { gsap.set(all, { autoAlpha: 1 }); });

      return () => mm.revert();
    },
    { scope: ref },
  );

  return <Tag ref={ref} className={className}>{children}</Tag>;
}
