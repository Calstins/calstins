// Client-safe constants describing the customer-journey grouping used on the
// public site. Labels/intros are presentation copy; which services belong to
// which stage is controlled entirely from the admin (Service.stage).
export const STAGE_ORDER = ["START", "BUILD", "GROW"] as const;
export type StageKey = (typeof STAGE_ORDER)[number];

export const STAGES: Record<StageKey, { label: string; kicker: string; intro: string }> = {
  START: {
    label: "Start",
    kicker: "Get established",
    intro: "Put the right foundations in place before you spend on anything else.",
  },
  BUILD: {
    label: "Build",
    kicker: "Look credible, work properly",
    intro: "Turn the business into something customers can find, trust and buy from.",
  },
  GROW: {
    label: "Grow",
    kicker: "Compound what works",
    intro: "Measure, improve and scale once the foundations are carrying weight.",
  },
};

export const UNSTAGED = { key: "ADVISORY", label: "Advisory & delivery", kicker: "Our core practice" } as const;

export function isStageKey(v: unknown): v is StageKey {
  return typeof v === "string" && (STAGE_ORDER as readonly string[]).includes(v);
}
