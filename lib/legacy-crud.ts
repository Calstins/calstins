import { HttpError } from "@/lib/api";
import slugify from "slugify";

type Kind = "str" | "opt" | "int" | "bool" | "strs";
export type Shape = Record<string, Kind>;

/**
 * Keeps ONLY the fields in `shape`, coerced to the right type. The admin forms post the whole row back
 * (id, createdAt, updatedAt, _count ...), which the database rejects; anything unknown is dropped here.
 * Fields absent from the body are left out so a partial update (e.g. toggling "published") is safe.
 */
export function pick(body: unknown, shape: Shape, required: string[] = []): Record<string, unknown> {
  if (!body || typeof body !== "object") throw new HttpError(400, "Request body must be a JSON object");
  const src = body as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  const fields: Record<string, string> = {};
  for (const [key, kind] of Object.entries(shape)) {
    if (!(key in src) || src[key] === undefined) continue;
    const v = src[key];
    switch (kind) {
      case "str": out[key] = typeof v === "string" ? v.trim() : String(v ?? "").trim(); break;
      case "opt": { const s = v == null ? "" : String(v).trim(); out[key] = s === "" ? null : s; break; }
      case "int": { const n = Number(v); if (!Number.isFinite(n)) fields[key] = "Must be a number"; else out[key] = Math.round(n); break; }
      case "bool": out[key] = v === true || v === "true"; break;
      case "strs": out[key] = Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : []; break;
    }
  }
  for (const key of required) {
    if (key in out ? out[key] === "" || out[key] == null : false) fields[key] = "Required";
  }
  if (Object.keys(fields).length) throw new HttpError(400, "Please fix the highlighted fields", fields);
  return out;
}

/** For creates: every `required` field must be present and non-empty. */
export function pickNew(body: unknown, shape: Shape, required: string[]): Record<string, unknown> {
  const out = pick(body, shape, required);
  const fields: Record<string, string> = {};
  for (const key of required) if (out[key] === undefined || out[key] === "" || out[key] === null) fields[key] = "Required";
  if (Object.keys(fields).length) throw new HttpError(400, "Please fill in: " + Object.keys(fields).join(", "), fields);
  return out;
}

export const toSlug = (s: string) => slugify(s, { lower: true, strict: true });

export const PROJECT_SHAPE: Shape = { title: "str", slug: "str", client: "opt", category: "opt", description: "opt", longDesc: "opt", outcome: "opt", url: "opt", tags: "strs", coverImage: "opt", featured: "bool", partnership: "bool", order: "int" };
export const CLIENT_SHAPE: Shape = { name: "str", logo: "opt", url: "opt", industry: "opt", featured: "bool", order: "int" };
export const TESTIMONIAL_SHAPE: Shape = { name: "str", role: "str", company: "str", avatar: "opt", quote: "str", rating: "int", featured: "bool", order: "int" };
export const MODE_SHAPE: Shape = { number: "str", title: "str", description: "str", bullets: "strs", tag: "str", order: "int" };
export const POST_SHAPE: Shape = { title: "str", slug: "str", excerpt: "str", content: "str", coverImage: "opt", tags: "strs", category: "str", metaTitle: "opt", metaDesc: "opt", focusKeyword: "opt", keywords: "strs", published: "bool", readTime: "int" };
