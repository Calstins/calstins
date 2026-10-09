import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET() {
  const modes = await prisma.engagementMode.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(modes);
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const mode = await prisma.engagementMode.create({ data: body });
  return NextResponse.json(mode, { status: 201 });
}
