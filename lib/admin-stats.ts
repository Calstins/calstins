import { prisma } from "@/lib/prisma";
import { describeDbError, type DbProblem } from "@/lib/db-errors";

export type DashboardData =
  | { ok: true; stats: { posts: number; projects: number; contacts: number; testimonials: number; clients: number; unread: number }; recent: { id: string; name: string; email: string; service: string | null; read: boolean; createdAt: Date }[] }
  | { ok: false; problem: DbProblem };

/** Never throws: a database outage becomes a readable state instead of a crashed page. */
export async function getDashboardData(): Promise<DashboardData> {
  try {
    const [posts, projects, contacts, testimonials, clients, unread, recent] = await Promise.all([
      prisma.post.count(),
      prisma.project.count(),
      prisma.contact.count(),
      prisma.testimonial.count(),
      prisma.client.count(),
      prisma.contact.count({ where: { read: false } }),
      prisma.contact.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);
    return { ok: true, stats: { posts, projects, contacts, testimonials, clients, unread }, recent };
  } catch (e) {
    console.error("[admin] dashboard data failed", e);
    return { ok: false, problem: describeDbError(e) };
  }
}
