import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, isAdminRequest, parseBody, requireAdmin, type Ctx } from "@/lib/api";
import { packageInput, isObjectId } from "@/lib/validation";

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const row = await prisma.servicePackage.findUnique({ where: { id } });
    if (!row || (!row.published && !(await isAdminRequest(req)))) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { slug, serviceId, ...data } = await parseBody(req, packageInput);
    const existing = await prisma.servicePackage.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (slug && slug !== existing.slug && (await prisma.servicePackage.findUnique({ where: { slug } }))) {
      return NextResponse.json({ error: "That slug is already in use", fields: { slug: "Already in use" } }, { status: 409 });
    }
    if (serviceId && !(await prisma.service.findUnique({ where: { id: serviceId }, select: { id: true } }))) {
      return NextResponse.json({ error: "Linked service does not exist", fields: { serviceId: "Service not found" } }, { status: 400 });
    }
    const updated = await prisma.servicePackage.update({ where: { id }, data: { ...data, slug: slug || existing.slug, serviceId } });
    return NextResponse.json(updated);
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
    await prisma.servicePackage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return errorResponse(e);
  }
}
