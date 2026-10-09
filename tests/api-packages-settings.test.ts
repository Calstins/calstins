import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", async () => ({ prisma: (await import("./helpers/fakePrisma")).fake }));
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail: vi.fn().mockResolvedValue({}) }) } }));

import * as packages from "@/app/api/packages/route";
import * as packageById from "@/app/api/packages/[id]/route";
import * as settings from "@/app/api/settings/route";
import * as contacts from "@/app/api/contacts/route";
import * as faqs from "@/app/api/faqs/route";
import * as blog from "@/app/api/blog/route";
import * as blogBySlug from "@/app/api/blog/[slug]/route";
import { resetAll, tables } from "./helpers/fakePrisma";
import { adminCookie, ctx, req, slugCtx } from "./helpers/req";

let cookie: string;
beforeEach(async () => { resetAll(); cookie = await adminCookie(); });
const pkg = { name: "Starter", summary: "A starter package", priceType: "STARTING_AT", priceAmount: 150000, features: ["Thing one"] };

describe("packages API", () => {
  it("requires auth to create, update and delete", async () => {
    const row = tables.servicePackage.seed({ name: "P", slug: "p", published: true });
    expect((await packages.POST(req("/api/packages", { method: "POST", body: pkg }))).status).toBe(401);
    expect((await packageById.PUT(req(`/api/packages/${row.id}`, { method: "PUT", body: pkg }), ctx(row.id))).status).toBe(401);
    expect((await packageById.DELETE(req(`/api/packages/${row.id}`, { method: "DELETE" }), ctx(row.id))).status).toBe(401);
  });
  it("creates a DRAFT by default with a generated slug", async () => {
    const res = await packages.POST(req("/api/packages", { method: "POST", cookie, body: pkg }));
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ slug: "starter", published: false, priceType: "STARTING_AT", priceAmount: 150000, currency: "NGN" });
  });
  it("rejects invalid price combinations with field errors", async () => {
    const noAmount = await packages.POST(req("/api/packages", { method: "POST", cookie, body: { ...pkg, priceAmount: null } }));
    expect(noAmount.status).toBe(400);
    expect((await noAmount.json()).fields.priceAmount).toBeTruthy();
    const badRange = await packages.POST(req("/api/packages", { method: "POST", cookie, body: { ...pkg, priceType: "RANGE", priceMin: 500, priceMax: 100 } }));
    expect(badRange.status).toBe(400);
    const negative = await packages.POST(req("/api/packages", { method: "POST", cookie, body: { ...pkg, priceAmount: -10 } }));
    expect(negative.status).toBe(400);
  });
  it("rejects duplicate slugs and unknown linked services", async () => {
    await packages.POST(req("/api/packages", { method: "POST", cookie, body: pkg }));
    expect((await packages.POST(req("/api/packages", { method: "POST", cookie, body: pkg }))).status).toBe(409);
    const res = await packages.POST(req("/api/packages", { method: "POST", cookie, body: { ...pkg, name: "Other", serviceId: "e".repeat(24) } }));
    expect(res.status).toBe(400);
  });
  it("public listing returns only published packages; ?all=1 needs admin", async () => {
    tables.servicePackage.seed({ name: "Live", slug: "live", published: true });
    tables.servicePackage.seed({ name: "Draft", slug: "draft", published: false });
    const pub = await (await packages.GET(req("/api/packages"))).json();
    expect(pub.map((p: { slug: string }) => p.slug)).toEqual(["live"]);
    const sneaky = await (await packages.GET(req("/api/packages?all=1"))).json();
    expect(sneaky).toHaveLength(1);
    const admin = await (await packages.GET(req("/api/packages?all=1", { cookie }))).json();
    expect(admin).toHaveLength(2);
  });
  it("a draft package is 404 by id publicly", async () => {
    const d = tables.servicePackage.seed({ name: "Draft", slug: "draft", published: false });
    expect((await packageById.GET(req(`/api/packages/${d.id}`), ctx(d.id))).status).toBe(404);
    expect((await packageById.GET(req(`/api/packages/${d.id}`, { cookie }), ctx(d.id))).status).toBe(200);
  });
  it("update + delete work for admins and report 404 afterwards", async () => {
    const row = tables.servicePackage.seed({ name: "P", slug: "p", published: false });
    const upd = await packageById.PUT(req(`/api/packages/${row.id}`, { method: "PUT", cookie, body: { ...pkg, published: true } }), ctx(row.id));
    expect(upd.status).toBe(200);
    expect(await upd.json()).toMatchObject({ published: true, slug: "p" });
    expect((await packageById.DELETE(req(`/api/packages/${row.id}`, { method: "DELETE", cookie }), ctx(row.id))).status).toBe(200);
    expect((await packageById.DELETE(req(`/api/packages/${row.id}`, { method: "DELETE", cookie }), ctx(row.id))).status).toBe(404);
  });
});

describe("settings API", () => {
  it("never exposes an unverified registration number publicly, even to a probing admin flag", async () => {
    tables.companySettings.seed({ key: "company", companyName: "Calstins Ltd", registrationNumber: "RC 999", registrationVerified: false });
    const pub = await (await settings.GET(req("/api/settings"))).json();
    expect(pub.registrationNumber).toBeNull();
    const probe = await (await settings.GET(req("/api/settings?raw=1"))).json(); // raw=1 without admin must not leak
    expect(JSON.stringify(probe)).not.toContain("RC 999");
    const admin = await (await settings.GET(req("/api/settings?raw=1", { cookie }))).json();
    expect(admin.registrationNumber).toBe("RC 999");
  });
  it("shows the number once verified", async () => {
    tables.companySettings.seed({ key: "company", registrationNumber: "RC 1234567", registrationVerified: true });
    expect((await (await settings.GET(req("/api/settings"))).json()).registrationNumber).toBe("RC 1234567");
  });
  it("PUT needs admin, validates, and upserts a single record", async () => {
    expect((await settings.PUT(req("/api/settings", { method: "PUT", body: { companyName: "X" } }))).status).toBe(401);
    expect((await settings.PUT(req("/api/settings", { method: "PUT", cookie, body: { companyName: "X", registrationVerified: true } }))).status).toBe(400);
    expect((await settings.PUT(req("/api/settings", { method: "PUT", cookie, body: { companyName: "Calstins Ltd", publicEmail: "info@calstins.com" } }))).status).toBe(200);
    expect((await settings.PUT(req("/api/settings", { method: "PUT", cookie, body: { companyName: "Calstins Limited" } }))).status).toBe(200);
    expect(tables.companySettings.rows).toHaveLength(1);
    expect(tables.companySettings.rows[0].companyName).toBe("Calstins Limited");
  });
});

describe("faqs API", () => {
  it("public list only shows published; create requires admin", async () => {
    tables.faq.seed({ question: "a", answer: "b", published: true });
    tables.faq.seed({ question: "c", answer: "d", published: false });
    expect(await (await faqs.GET(req("/api/faqs"))).json()).toHaveLength(1);
    expect((await faqs.POST(req("/api/faqs", { method: "POST", body: { question: "How does it work?", answer: "Like this, in short." } }))).status).toBe(401);
    expect((await faqs.POST(req("/api/faqs", { method: "POST", cookie, body: { question: "How does it work?", answer: "Like this, in short." } }))).status).toBe(201);
  });
});

describe("regression: pre-existing data leaks", () => {
  it("GET /api/contacts requires an admin (personal data)", async () => {
    tables.contact.seed({ name: "Jane", email: "jane@example.com", message: "hello there" });
    expect((await contacts.GET(req("/api/contacts"))).status).toBe(401);
    expect((await contacts.GET(req("/api/contacts", { cookie }))).status).toBe(200);
  });
  it("contact form: validates, stores, and silently drops honeypot submissions", async () => {
    const good = { name: "Jane Doe", email: "jane@example.com", message: "I would like a website." };
    expect((await contacts.POST(req("/api/contacts", { method: "POST", body: { ...good, email: "nope" } }))).status).toBe(400);
    expect((await contacts.POST(req("/api/contacts", { method: "POST", body: good }))).status).toBe(200);
    expect(tables.contact.rows).toHaveLength(1);
    const bot = await contacts.POST(req("/api/contacts", { method: "POST", body: { ...good, website: "http://spam.example" } }));
    expect(bot.status).toBe(200); // looks like success to the bot
    expect(tables.contact.rows).toHaveLength(1); // but nothing was stored
  });
  it("blog list: ?admin=1 does not reveal drafts without a session", async () => {
    tables.post.seed({ title: "Live", slug: "live", published: true });
    tables.post.seed({ title: "Draft", slug: "draft", published: false });
    const anon = await (await blog.GET(req("/api/blog?admin=1"))).json();
    expect(anon.posts.map((p: { slug: string }) => p.slug)).toEqual(["live"]);
    const admin = await (await blog.GET(req("/api/blog?admin=1", { cookie }))).json();
    expect(admin.posts).toHaveLength(2);
  });
  it("blog detail: a draft is 404 without a session", async () => {
    tables.post.seed({ title: "Draft", slug: "draft", published: false, views: 0 });
    expect((await blogBySlug.GET(req("/api/blog/draft"), slugCtx("draft"))).status).toBe(404);
    expect((await blogBySlug.GET(req("/api/blog/draft", { cookie }), slugCtx("draft"))).status).toBe(200);
  });
});
