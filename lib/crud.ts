import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import slugify from "slugify";

// Services CRUD
export async function createRoute(model: any, req: NextRequest, withSlug = false) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (withSlug && !body.slug) {
    body.slug = slugify(body.title, { lower: true, strict: true });
  }

  const record = await model.create({ data: body });
  return NextResponse.json(record, { status: 201 });
}

export async function listRoute(model: any, req: NextRequest, publicOnly = false) {
  const where: any = {};
  const { searchParams } = new URL(req.url);
  if (publicOnly) where.published = true;
  const featured = searchParams.get("featured");
  if (featured) where.featured = true;

  const records = await model.findMany({
    where,
    orderBy: { order: "asc" },
  });
  return NextResponse.json(records);
}
