import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET() {
  const testimonials = await prisma.testimonial.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(testimonials);
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const t = await prisma.testimonial.create({ data: body });
  return NextResponse.json(t, { status: 201 });
}
