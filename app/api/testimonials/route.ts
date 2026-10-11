import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, requireAdmin, HttpError } from "@/lib/api";
import { pick, pickNew, toSlug, TESTIMONIAL_SHAPE } from "@/lib/legacy-crud";

export async function GET() {
  try { return NextResponse.json(await prisma.testimonial.findMany({ orderBy: { order: "asc" } })); }
  catch (e) { return errorResponse(e); }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const data = pickNew(await req.json().catch(() => null), TESTIMONIAL_SHAPE, ["name","quote"]);
    return NextResponse.json(await prisma.testimonial.create({ data: data as never }), { status: 201 });
  } catch (e) { return errorResponse(e); }
}
