import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: _bodyId, createdAt: _createdAt, ...body } = await req.json();
  void _bodyId; void _createdAt;
  const m = await prisma.engagementMode.update({ where: { id: id }, data: body });
  return NextResponse.json(m);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.engagementMode.delete({ where: { id: id } });
  return NextResponse.json({ success: true });
}
