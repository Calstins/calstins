import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { getAdminFromRequest } from "@/lib/auth";

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

/** Returns a 401 response when the caller is not an authenticated admin, otherwise null. */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const admin = await getAdminFromRequest(req);
  return admin ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  return !!(await getAdminFromRequest(req));
}

export async function parseBody<S extends ZodTypeAny>(req: NextRequest, schema: S): Promise<z.output<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON");
  }
  return schema.parse(raw);
}

export function fieldErrors(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

type PrismaLikeError = { code?: string; meta?: { target?: unknown } };

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message, details: err.details }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json({ error: "Validation failed", fields: fieldErrors(err) }, { status: 400 });
  }
  const code = (err as PrismaLikeError)?.code;
  if (code === "P2002") return NextResponse.json({ error: "That slug is already in use", fields: { slug: "Already in use" } }, { status: 409 });
  if (code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (code === "P2023") return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  console.error("[api]", err);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}

export type Ctx<P extends Record<string, string> = { id: string }> = { params: Promise<P> };
