// Server-side read helpers for the public site. Every helper degrades to an
// empty result (and logs) instead of crashing a whole page when one query fails.
import { prisma } from "@/lib/prisma";
import type { Faq, Service, ServicePackage, ServiceSubItem } from "@prisma/client";
import { STAGE_ORDER, STAGES, UNSTAGED, type StageKey } from "@/lib/stages";

export type ServiceWithItems = Service & { subItems: ServiceSubItem[] };
export type ServiceWithPackages = ServiceWithItems & { packages: ServicePackage[]; faqs: Faq[] };

async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error(`[data] ${label} failed`, e);
    return fallback;
  }
}

/** Legacy rows have no `published` field; they are live today, so null/undefined counts as published. */
export const isServicePublished = (s: { published?: boolean | null }) => s.published !== false;

export function getPublishedServices(opts: { featuredOnly?: boolean } = {}): Promise<ServiceWithItems[]> {
  return safe(
    "services",
    async () => {
      const rows = await prisma.service.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: { subItems: { orderBy: { order: "asc" } } },
      });
      return rows.filter((s) => isServicePublished(s) && (!opts.featuredOnly || s.featured));
    },
    [],
  );
}

export function getPublishedServiceBySlug(slug: string): Promise<ServiceWithPackages | null> {
  return safe(
    "service-by-slug",
    async () => {
      const row = await prisma.service.findUnique({
        where: { slug },
        include: {
          subItems: { orderBy: { order: "asc" } },
          packages: { where: { published: true }, orderBy: { order: "asc" } },
          faqs: { where: { published: true }, orderBy: { order: "asc" } },
        },
      });
      return row && isServicePublished(row) ? row : null;
    },
    null,
  );
}

export function getPublishedPackages(): Promise<ServicePackage[]> {
  return safe(
    "packages",
    () => prisma.servicePackage.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
    [],
  );
}

export function getPublishedFaqs(): Promise<Faq[]> {
  return safe("faqs", () => prisma.faq.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] }), []);
}

export interface StageGroup<T> {
  key: StageKey | typeof UNSTAGED.key;
  label: string;
  kicker: string;
  intro?: string;
  items: T[];
}

/** Group by journey stage in Start/Build/Grow order, with unstaged items last. Empty groups are dropped. */
export function groupByStage<T extends { stage?: string | null }>(items: T[]): StageGroup<T>[] {
  const groups: StageGroup<T>[] = STAGE_ORDER.map((k) => ({
    key: k,
    label: STAGES[k].label,
    kicker: STAGES[k].kicker,
    intro: STAGES[k].intro,
    items: items.filter((i) => i.stage === k),
  }));
  groups.push({
    key: UNSTAGED.key,
    label: UNSTAGED.label,
    kicker: UNSTAGED.kicker,
    items: items.filter((i) => !i.stage || !(STAGE_ORDER as readonly string[]).includes(i.stage)),
  });
  return groups.filter((g) => g.items.length > 0);
}

// ── other public content (already admin-managed; reads only) ─────────────────
export function getEngagementModes() {
  return safe("modes", () => prisma.engagementMode.findMany({ orderBy: { order: "asc" } }), []);
}
export function getFeaturedProjects(limit?: number) {
  return safe("featured-projects", () => prisma.project.findMany({ where: { featured: true }, orderBy: { order: "asc" }, ...(limit ? { take: limit } : {}) }), []);
}
export function getFeaturedTestimonials() {
  return safe("testimonials", () => prisma.testimonial.findMany({ where: { featured: true }, orderBy: { order: "asc" } }), []);
}
export function getFeaturedClients() {
  return safe("clients", () => prisma.client.findMany({ where: { featured: true }, orderBy: { order: "asc" } }), []);
}
