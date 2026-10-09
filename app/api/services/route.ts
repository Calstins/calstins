import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, isAdminRequest, parseBody, requireAdmin } from "@/lib/api";
import { serviceInput, makeSlug } from "@/lib/validation";
import { isServicePublished } from "@/lib/data";

export async function GET(req: NextRequest) {
  try {
    const wantsAll = new URL(req.url).searchParams.get("all") === "1";
    const includeDrafts = wantsAll && (await isAdminRequest(req));
    const rows = await prisma.service.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        subItems: { orderBy: { order: "asc" } },
        _count: { select: { packages: true } },
      },
    });
    return NextResponse.json(includeDrafts ? rows : rows.filter(isServicePublished));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { subItems, slug, areaNumber, ...data } = await parseBody(req, serviceInput);
    const finalSlug = slug || makeSlug(data.title);
    if (await prisma.service.findUnique({ where: { slug: finalSlug } })) {
      return NextResponse.json({ error: "That slug is already in use", fields: { slug: "Already in use" } }, { status: 409 });
    }
    const count = await prisma.service.count();
    const svc = await prisma.service.create({
      data: { ...data, slug: finalSlug, areaNumber: areaNumber || String(count + 1).padStart(2, "0") },
    });
    try {
      for (const [i, sub] of (subItems ?? []).entries()) {
        const { id: _ignored, ...rest } = sub;
        void _ignored;
        await prisma.serviceSubItem.create({ data: { ...rest, order: rest.order || i, serviceId: svc.id } });
      }
    } catch (e) {
      // Compensate: do not leave a half-created service behind.
      await prisma.serviceSubItem.deleteMany({ where: { serviceId: svc.id } }).catch(() => {});
      await prisma.service.delete({ where: { id: svc.id } }).catch(() => {});
      throw e;
    }
    const full = await prisma.service.findUnique({ where: { id: svc.id }, include: { subItems: { orderBy: { order: "asc" } } } });
    return NextResponse.json(full, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
