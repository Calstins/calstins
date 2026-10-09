import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminFromRequest } from "@/lib/auth";
import slugify from "slugify";

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
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const slug = body.slug || slugify(body.title, { lower: true, strict: true });

  const post = await prisma.post.create({
    data: { ...body, slug },
  });

  return NextResponse.json(post, { status: 201 });
}
