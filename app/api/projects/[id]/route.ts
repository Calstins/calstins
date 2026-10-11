import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireAdmin, HttpError } from "@/lib/api";
import { pick, pickNew, toSlug, PROJECT_SHAPE } from "@/lib/legacy-crud";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const p = await prisma.project.findUnique({ where: { id } });
    return p ? NextResponse.json(p) : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (e) { return errorResponse(e); }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    const data = pick(await req.json().catch(() => null), PROJECT_SHAPE, ["title"]);
    if (typeof data.slug === "string") data.slug = toSlug(data.slug) || undefined;
    if (data.slug === undefined) delete data.slug;
    return NextResponse.json(await prisma.project.update({ where: { id }, data: data as never }));
  } catch (e) { return errorResponse(e); }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) { return errorResponse(e); }
}
