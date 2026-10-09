import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import slugify from "slugify";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const where: any = {};
  if (searchParams.get("featured") === "true") where.featured = true;
  if (searchParams.get("partnership") === "true") where.partnership = true;
  const projects = await prisma.project.findMany({ where, orderBy: { order: "asc" } });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.slug) body.slug = slugify(body.title, { lower: true, strict: true });
  const p = await prisma.project.create({ data: body });
  return NextResponse.json(p, { status: 201 });
}
