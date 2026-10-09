import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, isAdminRequest, parseBody, requireAdmin, type Ctx } from "@/lib/api";
import { serviceInput, isObjectId } from "@/lib/validation";
import { isServicePublished } from "@/lib/data";

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const svc = await prisma.service.findUnique({
      where: { id },
      include: { subItems: { orderBy: { order: "asc" } } },
    });
    if (!svc || (!isServicePublished(svc) && !(await isAdminRequest(req)))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(svc);
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
    const { subItems, slug, areaNumber, ...data } = await parseBody(req, serviceInput);

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (slug && slug !== existing.slug && (await prisma.service.findUnique({ where: { slug } }))) {
      return NextResponse.json({ error: "That slug is already in use", fields: { slug: "Already in use" } }, { status: 409 });
    }

    await prisma.service.update({
      where: { id },
      data: { ...data, slug: slug || existing.slug, areaNumber: areaNumber || existing.areaNumber },
    });

    if (subItems) {
      // Upsert-then-prune: a mid-way failure leaves a superset of the intended rows, never data loss.
      const current = await prisma.serviceSubItem.findMany({ where: { serviceId: id }, select: { id: true } });
      const currentIds = new Set(current.map((c) => c.id));
      const keep = new Set<string>();
      for (const [i, sub] of subItems.entries()) {
        const { id: subId, ...rest } = sub;
        if (subId && currentIds.has(subId)) {
          keep.add(subId);
          await prisma.serviceSubItem.update({ where: { id: subId }, data: { ...rest, order: i } });
        } else {
          const created = await prisma.serviceSubItem.create({ data: { ...rest, order: i, serviceId: id } });
          keep.add(created.id);
        }
      }
      const stale = [...currentIds].filter((x) => !keep.has(x));
      if (stale.length) await prisma.serviceSubItem.deleteMany({ where: { id: { in: stale } } });
    }

    const full = await prisma.service.findUnique({ where: { id }, include: { subItems: { orderBy: { order: "asc" } } } });
    return NextResponse.json(full);
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
    if (!(await prisma.service.findUnique({ where: { id }, select: { id: true } }))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Priced packages and FAQs are valuable on their own: detach, never silently delete.
    const detachedPackages = (await prisma.servicePackage.updateMany({ where: { serviceId: id }, data: { serviceId: null } })).count;
    await prisma.faq.updateMany({ where: { serviceId: id }, data: { serviceId: null } });
    await prisma.serviceSubItem.deleteMany({ where: { serviceId: id } });
    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ success: true, detachedPackages });
  } catch (e) {
    return errorResponse(e);
  }
}
