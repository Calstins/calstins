// Pure pricing helpers (no I/O) so they are trivially unit-testable.
// Prices are whole currency units stored as integers: no floating point maths.

export type PriceType = "FIXED" | "STARTING_AT" | "RANGE" | "CUSTOM_QUOTE";
export type BillingPeriod = "ONE_OFF" | "MONTHLY" | "QUARTERLY" | "ANNUAL";

export interface PriceFields {
  priceType: PriceType;
  priceAmount?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  currency?: string | null;
  billingPeriod?: BillingPeriod | null;
}

export interface PriceDisplay {
  /** Explicit label: what kind of price this is. */
  typeLabel: "Fixed price" | "Starting from" | "Price range" | "Custom quote";
  /** Formatted money string, or null when there is no figure to show. */
  amount: string | null;
  /** "one-off", "per month" ... or null for quotes. */
  period: string | null;
  /** Single-line, screen-reader friendly summary. */
  text: string;
  /** False when the record asked for a figure but none was valid (shown as a quote, never as free). */
  isQuote: boolean;
}

const PERIOD_LABEL: Record<BillingPeriod, string> = {
  ONE_OFF: "one-off",
  MONTHLY: "per month",
  QUARTERLY: "per quarter",
  ANNUAL: "per year",
};

export function periodLabel(p?: BillingPeriod | null): string {
  return PERIOD_LABEL[p ?? "ONE_OFF"] ?? PERIOD_LABEL.ONE_OFF;
}

const isPositiveInt = (n: unknown): n is number =>
  typeof n === "number" && Number.isSafeInteger(n) && n > 0;

export function formatMoney(amount: number, currency = "NGN"): string {
  // en-NG renders NGN as "₦150,000"; other ISO codes fall back to Intl defaults.
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Unknown currency code: never throw into a render path.
    return `${currency} ${amount.toLocaleString("en-NG")}`;
  }
}

const QUOTE: PriceDisplay = {
  typeLabel: "Custom quote",
  amount: null,
  period: null,
  text: "Custom quote - request a proposal",
  isQuote: true,
};

export function formatPrice(p: PriceFields): PriceDisplay {
  const currency = p.currency || "NGN";
  const period = periodLabel(p.billingPeriod);
  switch (p.priceType) {
    case "FIXED": {
      if (!isPositiveInt(p.priceAmount)) return { ...QUOTE };
      const amount = formatMoney(p.priceAmount, currency);
      return { typeLabel: "Fixed price", amount, period, text: `Fixed price ${amount} ${period}`, isQuote: false };
    }
    case "STARTING_AT": {
      if (!isPositiveInt(p.priceAmount)) return { ...QUOTE };
      const amount = formatMoney(p.priceAmount, currency);
      return { typeLabel: "Starting from", amount, period, text: `Starting from ${amount} ${period}`, isQuote: false };
    }
    case "RANGE": {
      if (!isPositiveInt(p.priceMin) || !isPositiveInt(p.priceMax) || p.priceMax < p.priceMin) return { ...QUOTE };
      const amount = `${formatMoney(p.priceMin, currency)} – ${formatMoney(p.priceMax, currency)}`;
      return { typeLabel: "Price range", amount, period, text: `Price range ${amount} ${period}`, isQuote: false };
    }
    default:
      return { ...QUOTE };
  }
}

/** Sort key used to compare/sort packages by headline price; quotes sort last. */
export function priceSortValue(p: PriceFields): number {
  const d = formatPrice(p);
  if (d.isQuote) return Number.MAX_SAFE_INTEGER;
  return p.priceType === "RANGE" ? (p.priceMin as number) : (p.priceAmount as number);
}
