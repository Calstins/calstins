import { prisma } from "@/lib/prisma";
import type { CompanySettings } from "@prisma/client";

export const SETTINGS_KEY = "company";

/** Defaults come only from facts already present in the original site (name, email, city). */
export const SETTINGS_DEFAULTS = {
  companyName: "Calstins Ltd",
  publicEmail: "info@calstins.com",
  city: "Abuja",
  country: "Nigeria",
} as const;

/** Shown on the contact page until the owner edits them in admin (owner confirmed these on 2026-10-09). */
export const DEFAULT_CONTACT_PROMISES = ["Response within 24 hours", "Free 30-min consultation", "Transparent project scoping", "Fixed-price or milestone billing"];

export type PublicSettings = Omit<CompanySettings, "registrationNumber" | "registrationVerified" | "showContactDetails" | "contactPromises" | "id" | "key" | "createdAt" | "updatedAt"> & {
  /** Present ONLY when the owner marked it verified. Never guessed, never shown otherwise. */
  registrationNumber: string | null;
  contactPromises: string[];
};

export function toPublicSettings(row: Partial<CompanySettings> | null): PublicSettings {
  const r = row ?? {};
  const verified = !!(r.registrationVerified && r.registrationNumber);
  // Phone, WhatsApp and social links may hold placeholders until the owner switches them on.
  const show = !!r.showContactDetails;
  const shown = (v: string | null | undefined) => (show ? v ?? null : null);
  return {
    companyName: r.companyName || SETTINGS_DEFAULTS.companyName,
    legalName: r.legalName ?? null,
    publicEmail: r.publicEmail || SETTINGS_DEFAULTS.publicEmail,
    phone: shown(r.phone),
    whatsapp: shown(r.whatsapp),
    addressLine: r.addressLine ?? null,
    city: r.city || SETTINGS_DEFAULTS.city,
    country: r.country || SETTINGS_DEFAULTS.country,
    tagline: r.tagline ?? null,
    storyHeadline: r.storyHeadline ?? null,
    storyBody: r.storyBody ?? null,
    storyPublished: !!r.storyPublished,
    mission: r.mission ?? null,
    milestones: r.milestones ?? [],
    values: r.values ?? [],
    linkedin: shown(r.linkedin),
    twitter: shown(r.twitter),
    instagram: shown(r.instagram),
    facebook: shown(r.facebook),
    github: shown(r.github),
    contactCtaTitle: r.contactCtaTitle ?? null,
    contactCtaBody: r.contactCtaBody ?? null,
    pricingDisclaimer: r.pricingDisclaimer ?? null,
    contactPromises: r.contactPromises?.length ? r.contactPromises : [...DEFAULT_CONTACT_PROMISES],
    registrationNumber: verified ? (r.registrationNumber as string) : null,
  };
}

export async function getSettingsRow(): Promise<CompanySettings | null> {
  try {
    return await prisma.companySettings.findUnique({ where: { key: SETTINGS_KEY } });
  } catch (e) {
    console.error("[settings] read failed", e);
    return null;
  }
}

export async function getPublicSettings(): Promise<PublicSettings> {
  return toPublicSettings(await getSettingsRow());
}
