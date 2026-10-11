import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireAdmin, HttpError } from "@/lib/api";
import { pick, pickNew, toSlug, MODE_SHAPE } from "@/lib/legacy-crud";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    const data = pick(await req.json().catch(() => null), MODE_SHAPE, ["title"]);
    return NextResponse.json(await prisma.engagementMode.update({ where: { id }, data: data as never }));
  } catch (e) { return errorResponse(e); }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    await prisma.engagementMode.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) { return errorResponse(e); }
}
