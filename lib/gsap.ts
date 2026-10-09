// Single place GSAP plugins are registered. Import ONLY from client components.
// All plugins used here (ScrollTrigger, SplitText, Flip) ship in the public `gsap` package
// under GSAP's standard no-charge licence (https://gsap.com/standard-license).
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip);
}

export const NO_REDUCED_MOTION = "(prefers-reduced-motion: no-preference)";
export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

export { gsap, ScrollTrigger, SplitText, Flip, useGSAP };
