import { z } from "zod";
import slugify from "slugify";
import { ICON_KEYS } from "./icon-keys";

// ── primitives ────────────────────────────────────────────────────────────────
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const clean = (s: string) => s.replace(CONTROL, "").trim();

/** Trimmed, control-char-free string with length bounds. React escapes output; this keeps stored data tidy. */
export const text = (min: number, max: number) =>
  z.string().transform(clean).pipe(z.string().min(min, min ? "Required" : undefined).max(max, `Max ${max} characters`));

/** Optional text: blank string, null or undefined all become null. */
export const optText = (max: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v == null ? null : clean(v)))
    .pipe(z.string().max(max, `Max ${max} characters`).nullable())
    .transform((v) => (v ? v : null));

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const slugSchema = z
  .string()
  .transform((s) => s.trim().toLowerCase())
  .pipe(z.string().min(2).max(80).regex(SLUG_RE, "Use lowercase letters, numbers and single hyphens"));

export function makeSlug(title: string): string {
  return slugify(title, { lower: true, strict: true }).slice(0, 80);
}

/** CTA targets: site-relative path, https URL, mailto: or tel:. Anything else (javascript:, data:, http:) is rejected. */
export const CTA_URL_RE = /^(\/(?!\/)[^\s]*|https:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[0-9\s\-()]+)$/i;
export const ctaUrl = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (v == null ? null : v.trim()))
  .refine((v) => !v || CTA_URL_RE.test(v), "Use a /path, an https:// link, mailto: or tel:")
  .transform((v) => (v ? v : null));

export const httpsUrl = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (v == null ? null : v.trim()))
  .refine((v) => !v || /^https:\/\/[^\s]+$/i.test(v), "Must start with https://")
  .transform((v) => (v ? v : null));

export const stringList = (maxItems: number, maxLen: number) =>
  z
    .array(z.string())
    .default([])
    .transform((a) => a.map(clean).filter(Boolean))
    .pipe(z.array(z.string().max(maxLen, `Each item max ${maxLen} characters`)).max(maxItems, `Max ${maxItems} items`));

const order = z.coerce.number().int().min(0).max(100000).default(0);
const stage = z.enum(["START", "BUILD", "GROW"]).nullable().optional().transform((v) => v ?? null);
const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");

// ── services ─────────────────────────────────────────────────────────────────
export const subItemSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i).optional(),
  heading: text(1, 120),
  description: text(1, 800),
  bullets: stringList(20, 200),
  order: order,
});

export const serviceInput = z.object({
  title: text(2, 120),
  slug: slugSchema.optional().or(z.literal("").transform(() => undefined)),
  areaNumber: optText(8),
  stage,
  tagline: text(1, 280),
  description: text(1, 2000),
  icon: z.enum(ICON_KEYS).nullable().optional().transform((v) => v ?? null),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  order,
  seoTitle: optText(70),
  seoDescription: optText(180),
  scope: stringList(30, 200),
  deliveryTimeline: optText(120),
  ctaLabel: optText(40),
  ctaUrl,
  subItems: z.array(subItemSchema).max(30).optional(),
});
export type ServiceInput = z.infer<typeof serviceInput>;

// ── packages ─────────────────────────────────────────────────────────────────
const money = z.coerce.number().int("Whole amounts only").positive("Must be greater than zero").max(2_000_000_000);

export const packageInput = z
  .object({
    name: text(2, 120),
    slug: slugSchema.optional().or(z.literal("").transform(() => undefined)),
    serviceId: z.union([objectId, z.literal(""), z.null(), z.undefined()]).transform((v) => (v ? v : null)),
    stage,
    audience: optText(160),
    summary: text(1, 400),
    priceType: z.enum(["FIXED", "STARTING_AT", "RANGE", "CUSTOM_QUOTE"]),
    priceAmount: z.union([money, z.literal(""), z.null(), z.undefined()]).transform((v) => (v === "" || v == null ? null : v)),
    priceMin: z.union([money, z.literal(""), z.null(), z.undefined()]).transform((v) => (v === "" || v == null ? null : v)),
    priceMax: z.union([money, z.literal(""), z.null(), z.undefined()]).transform((v) => (v === "" || v == null ? null : v)),
    currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "3-letter ISO code, e.g. NGN").default("NGN"),
    billingPeriod: z.enum(["ONE_OFF", "MONTHLY", "QUARTERLY", "ANNUAL"]).default("ONE_OFF"),
    deliveryTimeline: optText(120),
    features: stringList(30, 200),
    exclusions: stringList(20, 200),
    notes: optText(600),
    featured: z.boolean().default(false),
    published: z.boolean().default(false),
    order,
    ctaLabel: optText(40),
    ctaUrl,
  })
  .superRefine((v, ctx) => {
    const need = (path: string, msg: string) => ctx.addIssue({ code: "custom", path: [path], message: msg });
    if (v.priceType === "FIXED" || v.priceType === "STARTING_AT") {
      if (v.priceAmount == null) need("priceAmount", "Enter the price amount");
    }
    if (v.priceType === "RANGE") {
      if (v.priceMin == null) need("priceMin", "Enter the lowest price");
      if (v.priceMax == null) need("priceMax", "Enter the highest price");
      if (v.priceMin != null && v.priceMax != null && v.priceMax < v.priceMin) need("priceMax", "Must be at least the lowest price");
    }
    if (v.published && v.features.length === 0) need("features", "Add at least one inclusion before publishing");
  })
  .transform((v) => {
    // Normalise: store only the price fields that belong to the chosen type.
    const out = { ...v };
    if (v.priceType === "CUSTOM_QUOTE") { out.priceAmount = null; out.priceMin = null; out.priceMax = null; }
    else if (v.priceType === "RANGE") { out.priceAmount = null; }
    else { out.priceMin = null; out.priceMax = null; }
    return out;
  });
export type PackageInput = z.infer<typeof packageInput>;

// ── FAQs ─────────────────────────────────────────────────────────────────────
export const faqInput = z.object({
  question: text(3, 240),
  answer: text(3, 2000),
  serviceId: z.union([objectId, z.literal(""), z.null(), z.undefined()]).transform((v) => (v ? v : null)),
  published: z.boolean().default(true),
  order,
});
export type FaqInput = z.infer<typeof faqInput>;

// ── company settings ─────────────────────────────────────────────────────────
const email = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (v == null ? null : v.trim()))
  .refine((v) => !v || z.string().email().safeParse(v).success, "Enter a valid email")
  .transform((v) => (v ? v : null));
const phone = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (v == null ? null : v.trim()))
  .refine((v) => !v || /^\+?[0-9][0-9\s\-()]{6,20}$/.test(v), "Enter a valid phone number")
  .transform((v) => (v ? v : null));

export const settingsInput = z
  .object({
    companyName: text(2, 120),
    legalName: optText(160),
    registrationNumber: optText(30),
    registrationVerified: z.boolean().default(false),
    publicEmail: email,
    phone,
    whatsapp: phone,
    addressLine: optText(200),
    city: optText(80),
    country: optText(80),
    tagline: optText(200),
    storyHeadline: optText(160),
    storyBody: optText(6000),
    storyPublished: z.boolean().default(false),
    mission: optText(600),
    milestones: z.array(z.object({ label: text(0, 40), title: text(1, 120), body: text(1, 800) })).max(20).default([]),
    values: z.array(z.object({ title: text(1, 80), body: text(1, 400) })).max(12).default([]),
    linkedin: httpsUrl,
    twitter: httpsUrl,
    instagram: httpsUrl,
    facebook: httpsUrl,
    github: httpsUrl,
    contactCtaTitle: optText(120),
    contactCtaBody: optText(400),
    pricingDisclaimer: optText(600),
    showContactDetails: z.boolean().default(false),
    contactPromises: z.array(text(1, 120)).max(8).default([]),
  })
  .superRefine((v, ctx) => {
    if (v.registrationNumber && !/^[A-Za-z0-9][A-Za-z0-9 \-/]{2,29}$/.test(v.registrationNumber)) {
      ctx.addIssue({ code: "custom", path: ["registrationNumber"], message: "Letters, numbers, spaces, - and / only" });
    }
    if (v.registrationVerified && !v.registrationNumber) {
      ctx.addIssue({ code: "custom", path: ["registrationNumber"], message: "Enter the number before marking it verified" });
    }
  });
export type SettingsInput = z.infer<typeof settingsInput>;

// ── contact inbox ─────────────────────────────────────────────────────────────
export const contactPatchInput = z.object({ read: z.boolean().optional(), replied: z.boolean().optional() }).strict();
export const replyInput = z.object({
  subject: text(3, 150),
  message: text(5, 5000),
});

// ── reorder ──────────────────────────────────────────────────────────────────
export const reorderInput = z.object({ ids: z.array(objectId).min(1).max(500) });

export const isObjectId = (v: string) => /^[a-f0-9]{24}$/i.test(v);
