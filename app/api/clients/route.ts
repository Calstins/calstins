import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET() {
  const clients = await prisma.client.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const client = await prisma.client.create({ data: body });
  return NextResponse.json(client, { status: 201 });
}
