import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireAdmin, HttpError } from "@/lib/api";
import { pick, pickNew, toSlug, PROJECT_SHAPE } from "@/lib/legacy-crud";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const where: { featured?: boolean; partnership?: boolean } = {};
    if (searchParams.get("featured") === "true") where.featured = true;
    if (searchParams.get("partnership") === "true") where.partnership = true;
    return NextResponse.json(await prisma.project.findMany({ where, orderBy: { order: "asc" } }));
  } catch (e) { return errorResponse(e); }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const data = pickNew(await req.json().catch(() => null), PROJECT_SHAPE, ["title"]);
    data.slug = (data.slug as string) ? toSlug(data.slug as string) : toSlug(data.title as string);
    if (!data.slug) throw new HttpError(400, "Title or slug must contain letters or numbers", { slug: "Required" });
    return NextResponse.json(await prisma.project.create({ data: data as never }), { status: 201 });
  } catch (e) { return errorResponse(e); }
}
