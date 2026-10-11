import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { errorResponse, requireAdmin } from "@/lib/api";
import { pick, toSlug, POST_SHAPE } from "@/lib/legacy-crud";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug: slug } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Drafts are only visible to a signed-in admin (and do not count as views).
  if (!post.published) {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(post);
  }

  // Increment views
  await prisma.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } });

  return NextResponse.json(post);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { slug } = await params;
    const data = pick(await req.json().catch(() => null), POST_SHAPE, ["title", "excerpt", "content", "category"]);
    if (typeof data.slug === "string") data.slug = toSlug(data.slug) || undefined;
    if (data.slug === undefined) delete data.slug;
    return NextResponse.json(await prisma.post.update({ where: { slug }, data: data as never }));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.post.delete({ where: { slug: slug } });
  return NextResponse.json({ success: true });
}
