import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = vi.hoisted(() => ({
  post: { count: vi.fn() }, project: { count: vi.fn() }, testimonial: { count: vi.fn() }, client: { count: vi.fn() },
  contact: { count: vi.fn(), findMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { describeDbError } from "@/lib/db-errors";
import { getDashboardData } from "@/lib/admin-stats";

describe("describeDbError", () => {
  it("classifies the offline Prisma error from the dashboard", () => {
    expect(describeDbError(new Error("Server selection timeout: No available servers")).kind).toBe("timeout");
  });
  it("classifies DNS failures as network", () => {
    expect(describeDbError(new Error("querySrv ENOTFOUND _mongodb._tcp.cluster")).kind).toBe("network");
    expect(describeDbError(new Error("DNS resolution error")).kind).toBe("network");
  });
  it("classifies bad credentials", () => {
    expect(describeDbError(new Error("Authentication failed")).kind).toBe("auth");
  });
  it("falls back safely and never leaks the raw message", () => {
    const p = describeDbError(new Error("secret mongodb://user:pw@host"));
    expect(p.kind).toBe("unknown");
    expect(JSON.stringify(p)).not.toContain("pw@host");
  });
  it("accepts non-Error values", () => {
    expect(describeDbError(undefined).kind).toBe("unknown");
    expect(describeDbError("ECONNREFUSED").kind).toBe("timeout");
  });
});

describe("getDashboardData", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    for (const t of [prismaMock.post, prismaMock.project, prismaMock.testimonial, prismaMock.client, prismaMock.contact]) t.count.mockResolvedValue(2);
    prismaMock.contact.findMany.mockResolvedValue([]);
  });
  it("returns stats when the database is up", async () => {
    const r = await getDashboardData();
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.stats.posts).toBe(2);
  });
  it("returns a problem instead of throwing when the database is down", async () => {
    prismaMock.post.count.mockRejectedValue(new Error("No available servers"));
    const r = await getDashboardData();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.problem.kind).toBe("timeout");
  });
});
