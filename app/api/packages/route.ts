import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, isAdminRequest, parseBody, requireAdmin } from "@/lib/api";
import { packageInput, makeSlug } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams;
    const includeDrafts = sp.get("all") === "1" && (await isAdminRequest(req));
    const where: { published?: boolean; serviceId?: string } = {};
    if (!includeDrafts) where.published = true;
    const serviceId = sp.get("serviceId");
    if (serviceId) where.serviceId = serviceId;
    const rows = await prisma.servicePackage.findMany({ where, orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
    return NextResponse.json(rows);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { slug, serviceId, ...data } = await parseBody(req, packageInput);
    const finalSlug = slug || makeSlug(data.name);
    if (await prisma.servicePackage.findUnique({ where: { slug: finalSlug } })) {
      return NextResponse.json({ error: "That slug is already in use", fields: { slug: "Already in use" } }, { status: 409 });
    }
    if (serviceId && !(await prisma.service.findUnique({ where: { id: serviceId }, select: { id: true } }))) {
      return NextResponse.json({ error: "Linked service does not exist", fields: { serviceId: "Service not found" } }, { status: 400 });
    }
    const created = await prisma.servicePackage.create({ data: { ...data, slug: finalSlug, serviceId } });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
