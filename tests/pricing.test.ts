import { describe, expect, it } from "vitest";
import { formatMoney, formatPrice, periodLabel, priceSortValue } from "@/lib/pricing";

describe("formatMoney", () => {
  it("formats NGN in whole naira with the naira sign and thousands separators", () => {
    expect(formatMoney(150000, "NGN")).toBe("₦150,000");
    expect(formatMoney(1250000)).toBe("₦1,250,000");
  });
  it("has no floating-point artefacts for large integers", () => {
    expect(formatMoney(2_000_000_000, "NGN")).toBe("₦2,000,000,000");
  });
  it("supports other currencies and never throws on a bad code", () => {
    expect(formatMoney(99, "USD")).toContain("99");
    expect(() => formatMoney(10, "???")).not.toThrow();
  });
});

describe("formatPrice", () => {
  it("labels a fixed price explicitly", () => {
    const p = formatPrice({ priceType: "FIXED", priceAmount: 150000, currency: "NGN", billingPeriod: "ONE_OFF" });
    expect(p).toMatchObject({ typeLabel: "Fixed price", amount: "₦150,000", period: "one-off", isQuote: false });
    expect(p.text).toBe("Fixed price ₦150,000 one-off");
  });
  it("labels starting-from prices and monthly billing", () => {
    const p = formatPrice({ priceType: "STARTING_AT", priceAmount: 50000, billingPeriod: "MONTHLY" });
    expect(p.typeLabel).toBe("Starting from");
    expect(p.period).toBe("per month");
    expect(p.text).toContain("Starting from ₦50,000");
  });
  it("renders a range with an en dash", () => {
    const p = formatPrice({ priceType: "RANGE", priceMin: 100000, priceMax: 250000 });
    expect(p.typeLabel).toBe("Price range");
    expect(p.amount).toBe("₦100,000 – ₦250,000");
  });
  it("shows custom quotes without any figure", () => {
    const p = formatPrice({ priceType: "CUSTOM_QUOTE", priceAmount: 999 });
    expect(p).toMatchObject({ typeLabel: "Custom quote", amount: null, isQuote: true });
  });
  it("NEVER renders a missing, zero or invalid price as free: it falls back to a quote", () => {
    for (const bad of [
      { priceType: "FIXED" as const, priceAmount: null },
      { priceType: "FIXED" as const, priceAmount: 0 },
      { priceType: "STARTING_AT" as const, priceAmount: -5 },
      { priceType: "FIXED" as const, priceAmount: 12.5 },
      { priceType: "RANGE" as const, priceMin: 500, priceMax: 100 },
      { priceType: "RANGE" as const, priceMin: null, priceMax: 100 },
    ]) {
      const p = formatPrice(bad);
      expect(p.isQuote).toBe(true);
      expect(p.amount).toBeNull();
      expect(p.text).not.toMatch(/₦0|free/i);
    }
  });
  it("defaults currency to NGN and billing to one-off", () => {
    expect(formatPrice({ priceType: "FIXED", priceAmount: 1000 }).text).toBe("Fixed price ₦1,000 one-off");
    expect(periodLabel(undefined)).toBe("one-off");
  });
});

describe("priceSortValue", () => {
  it("sorts by headline price with quotes last", () => {
    const items = [
      { priceType: "CUSTOM_QUOTE" as const },
      { priceType: "FIXED" as const, priceAmount: 300 },
      { priceType: "RANGE" as const, priceMin: 100, priceMax: 900 },
    ];
    const sorted = [...items].sort((a, b) => priceSortValue(a) - priceSortValue(b));
    expect(sorted.map((i) => i.priceType)).toEqual(["RANGE", "FIXED", "CUSTOM_QUOTE"]);
  });
});
