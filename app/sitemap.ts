import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getPublishedPackages, getPublishedServices } from "@/lib/data";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, packages, posts] = await Promise.all([
    getPublishedServices(),
    getPublishedPackages(),
    prisma.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }).catch(() => []),
  ]);
  const now = new Date();
  const fixed = ["/", "/services", "/work", "/about", "/blog", "/contact", ...(packages.length ? ["/pricing"] : [])];
  return [
    ...fixed.map((p) => ({ url: absoluteUrl(p), lastModified: now, changeFrequency: "monthly" as const, priority: p === "/" ? 1 : 0.7 })),
    ...services.map((s) => ({ url: absoluteUrl(`/services/${s.slug}`), lastModified: s.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...posts.map((p) => ({ url: absoluteUrl(`/blog/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "yearly" as const, priority: 0.5 })),
  ];
}
