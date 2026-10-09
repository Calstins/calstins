import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, parseBody, requireAdmin, type Ctx } from "@/lib/api";
import { faqInput, isObjectId } from "@/lib/validation";

export async function PUT(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const data = await parseBody(req, faqInput);
    return NextResponse.json(await prisma.faq.update({ where: { id }, data }));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.faq.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return errorResponse(e);
  }
}
