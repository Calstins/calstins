import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", async () => ({ prisma: (await import("./helpers/fakePrisma")).fake }));

import * as services from "@/app/api/services/route";
import * as serviceById from "@/app/api/services/[id]/route";
import * as reorder from "@/app/api/services/reorder/route";
import { resetAll, tables } from "./helpers/fakePrisma";
import { adminCookie, ctx, req } from "./helpers/req";

const valid = { title: "Business Website", tagline: "A fast website", description: "We build it.", stage: "BUILD", icon: "Globe", scope: ["Design", "Build"], published: true };
let cookie: string;
beforeEach(async () => { resetAll(); cookie = await adminCookie(); });

describe("POST /api/services", () => {
  it("rejects unauthenticated requests", async () => {
    const res = await services.POST(req("/api/services", { method: "POST", body: valid }));
    expect(res.status).toBe(401);
    expect(tables.service.rows).toHaveLength(0);
  });
  it("rejects a forged / invalid token", async () => {
    const res = await services.POST(req("/api/services", { method: "POST", body: valid, cookie: "admin_token=not.a.jwt" }));
    expect(res.status).toBe(401);
  });
  it("validates input and returns field errors", async () => {
    const res = await services.POST(req("/api/services", { method: "POST", body: { ...valid, title: "", icon: "Nope", ctaUrl: "javascript:alert(1)" }, cookie }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(Object.keys(body.fields)).toEqual(expect.arrayContaining(["title", "icon", "ctaUrl"]));
  });
  it("rejects non-JSON bodies cleanly", async () => {
    const r = new NextRequest("http://localhost/api/services", { method: "POST", body: "{nope", headers: { cookie, "content-type": "application/json" } });
    const res = await services.POST(r);
    expect(res.status).toBe(400);
  });
  it("creates a service with a generated slug, area number and sub-items", async () => {
    const res = await services.POST(req("/api/services", { method: "POST", cookie, body: { ...valid, subItems: [{ heading: "Design", description: "UI", bullets: ["a"] }] } }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.slug).toBe("business-website");
    expect(body.areaNumber).toBe("01");
    expect(body.subItems).toHaveLength(1);
  });
  it("returns 409 for a duplicate slug", async () => {
    await services.POST(req("/api/services", { method: "POST", cookie, body: valid }));
    const res = await services.POST(req("/api/services", { method: "POST", cookie, body: valid }));
    expect(res.status).toBe(409);
    expect((await res.json()).fields.slug).toBeTruthy();
  });
});

describe("GET /api/services (draft visibility)", () => {
  beforeEach(() => {
    tables.service.seed({ title: "Legacy", slug: "legacy", areaNumber: "01", order: 0 }); // no `published` field, as in existing data
    tables.service.seed({ title: "Live", slug: "live", areaNumber: "02", order: 1, published: true });
    tables.service.seed({ title: "Draft", slug: "draft", areaNumber: "03", order: 2, published: false });
  });
  it("public list hides drafts but keeps legacy rows", async () => {
    const list = await (await services.GET(req("/api/services"))).json();
    expect(list.map((s: { slug: string }) => s.slug).sort()).toEqual(["legacy", "live"]);
  });
  it("?all=1 is ignored without an admin session", async () => {
    const list = await (await services.GET(req("/api/services?all=1"))).json();
    expect(list.map((s: { slug: string }) => s.slug)).not.toContain("draft");
  });
  it("admins can list drafts with ?all=1", async () => {
    const list = await (await services.GET(req("/api/services?all=1", { cookie }))).json();
    expect(list).toHaveLength(3);
  });
  it("a draft by id is 404 publicly and 200 for admins", async () => {
    const id = tables.service.rows.find((r) => r.slug === "draft")!.id;
    expect((await serviceById.GET(req(`/api/services/${id}`), ctx(id))).status).toBe(404);
    expect((await serviceById.GET(req(`/api/services/${id}`, { cookie }), ctx(id))).status).toBe(200);
  });
});

describe("PUT / DELETE /api/services/[id]", () => {
  it("requires auth", async () => {
    const s = tables.service.seed({ title: "X", slug: "x", areaNumber: "01" });
    expect((await serviceById.PUT(req(`/api/services/${s.id}`, { method: "PUT", body: valid }), ctx(s.id))).status).toBe(401);
    expect((await serviceById.DELETE(req(`/api/services/${s.id}`, { method: "DELETE" }), ctx(s.id))).status).toBe(401);
    expect(tables.service.rows).toHaveLength(1);
  });
  it("updates, keeps the existing slug when none is sent, and 404s for unknown ids", async () => {
    const s = tables.service.seed({ title: "Old", slug: "old", areaNumber: "07" });
    const res = await serviceById.PUT(req(`/api/services/${s.id}`, { method: "PUT", cookie, body: { ...valid, title: "New title" } }), ctx(s.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ title: "New title", slug: "old", areaNumber: "07" });
    const missing = "f".repeat(24);
    expect((await serviceById.PUT(req(`/api/services/${missing}`, { method: "PUT", cookie, body: valid }), ctx(missing))).status).toBe(404);
    expect((await serviceById.PUT(req("/api/services/zzz", { method: "PUT", cookie, body: valid }), ctx("zzz"))).status).toBe(404);
  });
  it("rejects changing a slug to one that is taken", async () => {
    tables.service.seed({ title: "A", slug: "taken", areaNumber: "01" });
    const b = tables.service.seed({ title: "B", slug: "b", areaNumber: "02" });
    const res = await serviceById.PUT(req(`/api/services/${b.id}`, { method: "PUT", cookie, body: { ...valid, slug: "taken" } }), ctx(b.id));
    expect(res.status).toBe(409);
  });
  it("syncs sub-items without ever dropping rows that were kept (update, add, prune)", async () => {
    const s = tables.service.seed({ title: "S", slug: "s", areaNumber: "01" });
    const keep = tables.serviceSubItem.seed({ serviceId: s.id, heading: "keep", description: "d", bullets: [], order: 0 });
    tables.serviceSubItem.seed({ serviceId: s.id, heading: "drop", description: "d", bullets: [], order: 1 });
    const res = await serviceById.PUT(req(`/api/services/${s.id}`, { method: "PUT", cookie, body: { ...valid, subItems: [{ id: keep.id, heading: "kept (edited)", description: "d", bullets: [] }, { heading: "brand new", description: "d", bullets: [] }] } }), ctx(s.id));
    expect(res.status).toBe(200);
    const headings = tables.serviceSubItem.rows.map((r) => r.heading).sort();
    expect(headings).toEqual(["brand new", "kept (edited)"]);
    expect(tables.serviceSubItem.rows.find((r) => r.id === keep.id)).toBeTruthy(); // same row, edited in place
  });
  it("delete detaches packages and FAQs instead of deleting them", async () => {
    const s = tables.service.seed({ title: "S", slug: "s", areaNumber: "01" });
    const p = tables.servicePackage.seed({ name: "P", slug: "p", serviceId: s.id });
    const f = tables.faq.seed({ question: "q", answer: "a", serviceId: s.id });
    tables.serviceSubItem.seed({ serviceId: s.id, heading: "h" });
    const res = await serviceById.DELETE(req(`/api/services/${s.id}`, { method: "DELETE", cookie }), ctx(s.id));
    expect(res.status).toBe(200);
    expect((await res.json()).detachedPackages).toBe(1);
    expect(tables.service.rows).toHaveLength(0);
    expect(tables.serviceSubItem.rows).toHaveLength(0);
    expect(tables.servicePackage.rows.find((r) => r.id === p.id)?.serviceId).toBeNull();
    expect(tables.faq.rows.find((r) => r.id === f.id)?.serviceId).toBeNull();
  });
});

describe("POST /api/services/reorder", () => {
  it("requires auth, validates ids, and applies the order", async () => {
    const a = tables.service.seed({ title: "A", slug: "a", areaNumber: "01", order: 0 });
    const b = tables.service.seed({ title: "B", slug: "b", areaNumber: "02", order: 1 });
    expect((await reorder.POST(req("/api/services/reorder", { method: "POST", body: { ids: [a.id] } }))).status).toBe(401);
    expect((await reorder.POST(req("/api/services/reorder", { method: "POST", cookie, body: { ids: ["bad"] } }))).status).toBe(400);
    expect((await reorder.POST(req("/api/services/reorder", { method: "POST", cookie, body: { ids: [b.id, a.id] } }))).status).toBe(200);
    expect(tables.service.rows.find((r) => r.id === b.id)!.order).toBe(0);
    expect(tables.service.rows.find((r) => r.id === a.id)!.order).toBe(1);
  });
});
