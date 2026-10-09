import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, parseBody, requireAdmin } from "@/lib/api";
import { contactPatchInput, isObjectId } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Whitelisted fields only: the previous version wrote the raw request body to the database.
    const data = await parseBody(req, contactPatchInput);
    if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    return NextResponse.json(await prisma.contact.update({ where: { id }, data }));
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
    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return errorResponse(e);
  }
}
