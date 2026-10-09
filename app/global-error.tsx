"use client";

// Replaces the root layout when it crashes, so it brings its own <html>, <body> and inline styles.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#172532", color: "#F6F4EE", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 32 }}>
        <div style={{ maxWidth: 520 }}>
          <p style={{ letterSpacing: "0.14em", textTransform: "uppercase", fontSize: 13, color: "#7FDC8A", margin: 0 }}>Something went wrong</p>
          <h1 style={{ fontSize: "clamp(2rem, 6vw, 3rem)", margin: "16px 0" }}>We hit a problem.</h1>
          <p style={{ color: "#B6C0C9", lineHeight: 1.6 }}>The site could not load. Please try again, and if it keeps happening, email info@calstins.com{error.digest ? ` and quote ${error.digest}` : ""}.</p>
          <button type="button" onClick={reset} style={{ marginTop: 24, padding: "14px 28px", borderRadius: 999, border: 0, background: "#7FDC8A", color: "#172532", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
