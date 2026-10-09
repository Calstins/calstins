import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", async () => ({ prisma: (await import("./helpers/fakePrisma")).fake }));

import bcrypt from "bcryptjs";
import * as auth from "@/app/api/auth/route";
import { resetAll, tables } from "./helpers/fakePrisma";
import { req } from "./helpers/req";

const login = (body: unknown) => auth.POST(req("/api/auth", { method: "POST", body }));
const original = process.env.JWT_SECRET;

beforeEach(() => {
  resetAll();
  process.env.JWT_SECRET = "a-test-secret-with-more-than-16-chars";
  tables.admin.seed({ email: "admin@calstins.com", name: "Admin", password: bcrypt.hashSync("correct-horse-battery", 4) });
});
afterEach(() => { process.env.JWT_SECRET = original; });

describe("auth API", () => {
  it("logs in with correct credentials, case-insensitive email, and sets an httpOnly cookie", async () => {
    const res = await login({ email: "  Admin@Calstins.com ", password: "correct-horse-battery" });
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("admin_token=");
    expect(cookie.toLowerCase()).toContain("httponly");
  });
  it("rejects wrong password and unknown email with the same 401", async () => {
    expect((await login({ email: "admin@calstins.com", password: "nope" })).status).toBe(401);
    expect((await login({ email: "ghost@calstins.com", password: "nope" })).status).toBe(401);
  });
  it("rejects malformed bodies with 400 instead of crashing", async () => {
    expect((await login({})).status).toBe(400);
    expect((await auth.POST(new (await import("next/server")).NextRequest("http://localhost/api/auth", { method: "POST", body: "not json" }))).status).toBe(400);
  });
  it("returns a clear 503 JSON error when JWT_SECRET is missing/short in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.JWT_SECRET = "short";
    const res = await login({ email: "admin@calstins.com", password: "correct-horse-battery" });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/JWT_SECRET/);
    vi.unstubAllEnvs();
  });
  it("GET reports the session; logout clears the cookie", async () => {
    expect((await auth.GET(req("/api/auth"))).status).toBe(401);
    const res = await login({ email: "admin@calstins.com", password: "correct-horse-battery" });
    const cookie = (res.headers.get("set-cookie") ?? "").split(";")[0];
    expect((await auth.GET(req("/api/auth", { cookie }))).status).toBe(200);
    expect((await auth.DELETE()).headers.get("set-cookie")).toMatch(/admin_token=;/);
  });
});
