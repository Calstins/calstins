import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import { errorResponse, requireAdmin, HttpError } from "@/lib/api";
import { pickNew, toSlug, POST_SHAPE } from "@/lib/legacy-crud";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "9");
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const admin = searchParams.get("admin") ? await getAdminFromRequest(req) : null;

  const where: any = {};
  if (!admin) where.published = true;
  if (category) where.category = category;
  if (tag) where.tags = { has: tag };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, title: true, slug: true, excerpt: true,
        coverImage: true, tags: true, category: true,
        published: true, views: true, readTime: true, createdAt: true,
        metaTitle: true, metaDesc: true, focusKeyword: true,
      },
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({ posts, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const data = pickNew(await req.json().catch(() => null), POST_SHAPE, ["title", "excerpt", "content", "category"]);
    data.slug = (data.slug as string) ? toSlug(data.slug as string) : toSlug(data.title as string);
    if (!data.slug) throw new HttpError(400, "Title or slug must contain letters or numbers", { slug: "Required" });
    return NextResponse.json(await prisma.post.create({ data: data as never }), { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
