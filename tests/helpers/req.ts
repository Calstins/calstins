import { NextRequest } from "next/server";
import { signToken } from "@/lib/auth";

export async function adminCookie() {
  return `admin_token=${await signToken({ id: "a".repeat(24), email: "admin@calstins.com" })}`;
}

export function req(url: string, opts: { method?: string; body?: unknown; cookie?: string } = {}) {
  return new NextRequest(`http://localhost${url}`, {
    method: opts.method ?? "GET",
    headers: { ...(opts.cookie ? { cookie: opts.cookie } : {}), ...(opts.body !== undefined ? { "content-type": "application/json" } : {}) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

export const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
export const slugCtx = (slug: string) => ({ params: Promise.resolve({ slug }) });
