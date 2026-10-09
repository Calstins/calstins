import type { Config } from "tailwindcss";

// Brand tokens are sampled from app/assets/calstins-logo.png:
//   navy background  #172532 (the logo's own flat background, so the asset blends in)
//   logo green       ~#50A050  -> light-green accent family below
//   logo blue        ~#3A78A8  -> secondary, used sparingly
// Legacy token names (ink / electric / volt / mist / snow) are kept and re-pointed to the
// new palette so the admin screens keep working and pick up the brand automatically.
const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── new semantic tokens (public site) ──
        navy: { DEFAULT: "#172532", 900: "#0F1A24", 800: "#172532", 700: "#1F3344", 600: "#2A4258", 500: "#3B5871" },
        paper: { DEFAULT: "#F6F4EE", 2: "#EDEAE1", 3: "#E2DED2" },
        leaf: { DEFAULT: "#7FDC8A", 300: "#A6EDAE", 400: "#7FDC8A", 500: "#4FBF5E", 600: "#2F7D3A", 700: "#245F2D" },
        brandblue: "#3A78A8",
        // ── legacy names (admin + shared) re-pointed ──
        ink: "#172532",
        "ink-light": "#1D2F3F",
        "ink-card": "#223548",
        "ink-border": "#33495C",
        electric: "#7FDC8A",
        "electric-dim": "#5FC76C",
        volt: "#C4F26B",
        "volt-dim": "#A3D24B",
        mist: "#A9B7C4",
        snow: "#F3F5F7",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      fontWeight: { 500: "500", 600: "600", 700: "700", 800: "800" },
      maxWidth: { measure: "62ch", wide: "88rem" },
      transitionTimingFunction: { out: "cubic-bezier(0.22, 1, 0.36, 1)" },
    },
  },
  plugins: [],
};
export default config;
