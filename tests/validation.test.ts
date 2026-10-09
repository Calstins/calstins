import { describe, expect, it } from "vitest";
import { ctaUrl, faqInput, makeSlug, packageInput, serviceInput, settingsInput, slugSchema } from "@/lib/validation";

const pkg = (over: Record<string, unknown> = {}) => ({ name: "Starter", summary: "Short summary", priceType: "CUSTOM_QUOTE", features: ["One thing"], ...over });

describe("slugs", () => {
  it("generates URL-safe slugs", () => expect(makeSlug("Business Name Registration & Setup!")).toBe("business-name-registration-and-setup"));
  it("rejects malformed slugs", () => {
    for (const s of ["Has Space", "a--b", "-lead", "trail-", "x", "under_score"]) expect(slugSchema.safeParse(s).success).toBe(false);
    expect(slugSchema.safeParse("good-slug-1").success).toBe(true);
    expect(slugSchema.parse("  MiXeD ")).toBe("mixed"); // input is normalised, not rejected
  });
});

describe("CTA urls", () => {
  it("accepts internal paths, https, mailto and tel", () => {
    for (const u of ["/contact", "/contact?service=x", "https://example.com/a", "mailto:info@calstins.com", "tel:+2348012345678"]) expect(ctaUrl.safeParse(u).success).toBe(true);
  });
  it("rejects script, data, plain http and protocol-relative URLs", () => {
    for (const u of ["javascript:alert(1)", "data:text/html,x", "http://example.com", "//evil.com", "ftp://x.com", "contact"]) expect(ctaUrl.safeParse(u).success).toBe(false);
  });
  it("treats blank as empty", () => expect(ctaUrl.parse("  ")).toBeNull());
});

describe("packageInput", () => {
  it("accepts a quote-only package with no amount", () => expect(packageInput.safeParse(pkg()).success).toBe(true));
  it("requires an amount for FIXED and STARTING_AT", () => {
    for (const t of ["FIXED", "STARTING_AT"]) {
      const r = packageInput.safeParse(pkg({ priceType: t }));
      expect(r.success).toBe(false);
      expect(JSON.stringify(r.error?.issues)).toContain("priceAmount");
    }
  });
  it("rejects zero, negative, fractional and absurd amounts", () => {
    for (const a of [0, -1, 10.5, 3_000_000_000]) expect(packageInput.safeParse(pkg({ priceType: "FIXED", priceAmount: a })).success).toBe(false);
  });
  it("accepts numeric strings from form inputs", () => expect(packageInput.parse(pkg({ priceType: "FIXED", priceAmount: "150000" })).priceAmount).toBe(150000));
  it("validates ranges (min required, max >= min)", () => {
    expect(packageInput.safeParse(pkg({ priceType: "RANGE", priceMin: 100 })).success).toBe(false);
    expect(packageInput.safeParse(pkg({ priceType: "RANGE", priceMin: 500, priceMax: 100 })).success).toBe(false);
    expect(packageInput.safeParse(pkg({ priceType: "RANGE", priceMin: 100, priceMax: 500 })).success).toBe(true);
  });
  it("normalises: stores only the price fields that belong to the type", () => {
    const q = packageInput.parse(pkg({ priceType: "CUSTOM_QUOTE", priceAmount: 5000, priceMin: 1, priceMax: 2 }));
    expect([q.priceAmount, q.priceMin, q.priceMax]).toEqual([null, null, null]);
    const f = packageInput.parse(pkg({ priceType: "FIXED", priceAmount: 5000, priceMin: 1, priceMax: 2 }));
    expect([f.priceAmount, f.priceMin, f.priceMax]).toEqual([5000, null, null]);
  });
  it("defaults to a DRAFT and NGN one-off", () => {
    const p = packageInput.parse(pkg());
    expect(p).toMatchObject({ published: false, currency: "NGN", billingPeriod: "ONE_OFF" });
  });
  it("will not publish a package without any inclusions", () => {
    expect(packageInput.safeParse(pkg({ published: true, features: [] })).success).toBe(false);
    expect(packageInput.safeParse(pkg({ published: true, features: ["   "] })).success).toBe(false);
  });
  it("trims list items and drops blanks", () => expect(packageInput.parse(pkg({ features: [" a ", "", "  "] })).features).toEqual(["a"]));
  it("validates currency codes and service ids", () => {
    expect(packageInput.safeParse(pkg({ currency: "naira" })).success).toBe(false);
    expect(packageInput.safeParse(pkg({ serviceId: "not-an-id" })).success).toBe(false);
    expect(packageInput.parse(pkg({ currency: "usd" })).currency).toBe("USD");
  });
});

describe("serviceInput", () => {
  const base = { title: "Website", tagline: "tag", description: "desc" };
  it("accepts minimum fields and defaults to published", () => expect(serviceInput.parse(base)).toMatchObject({ published: true, featured: false }));
  it("restricts icons to the allowlist", () => {
    expect(serviceInput.safeParse({ ...base, icon: "Globe" }).success).toBe(true);
    expect(serviceInput.safeParse({ ...base, icon: "<script>" }).success).toBe(false);
    expect(serviceInput.safeParse({ ...base, icon: "NotAnIcon" }).success).toBe(false);
  });
  it("restricts stage to START/BUILD/GROW or null", () => {
    expect(serviceInput.safeParse({ ...base, stage: "BUILD" }).success).toBe(true);
    expect(serviceInput.parse({ ...base, stage: null }).stage).toBeNull();
    expect(serviceInput.safeParse({ ...base, stage: "SCALE" }).success).toBe(false);
  });
  it("requires a title and rejects control characters", () => {
    expect(serviceInput.safeParse({ ...base, title: "  " }).success).toBe(false);
    expect(serviceInput.parse({ ...base, title: "A\u0000B title" }).title).toBe("AB title");
  });
});

describe("settingsInput", () => {
  const base = { companyName: "Calstins Ltd" };
  it("never lets an unverified number be marked verified without a number", () => {
    expect(settingsInput.safeParse({ ...base, registrationVerified: true }).success).toBe(false);
    expect(settingsInput.safeParse({ ...base, registrationVerified: true, registrationNumber: "RC 1234567" }).success).toBe(true);
  });
  it("rejects malformed registration numbers, emails and non-https socials", () => {
    expect(settingsInput.safeParse({ ...base, registrationNumber: "<b>RC</b>" }).success).toBe(false);
    expect(settingsInput.safeParse({ ...base, publicEmail: "nope" }).success).toBe(false);
    expect(settingsInput.safeParse({ ...base, linkedin: "http://linkedin.com/x" }).success).toBe(false);
    expect(settingsInput.safeParse({ ...base, linkedin: "https://linkedin.com/company/x" }).success).toBe(true);
  });
  it("turns blank optional fields into null", () => expect(settingsInput.parse({ ...base, phone: "", mission: "  " })).toMatchObject({ phone: null, mission: null }));
});

describe("faqInput", () => {
  it("requires a question and an answer", () => {
    expect(faqInput.safeParse({ question: "Why?", answer: "" }).success).toBe(false);
    expect(faqInput.parse({ question: "Why?", answer: "Because." })).toMatchObject({ published: true, serviceId: null });
  });
});
