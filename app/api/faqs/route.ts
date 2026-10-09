import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, isAdminRequest, parseBody, requireAdmin } from "@/lib/api";
import { faqInput } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const includeDrafts = new URL(req.url).searchParams.get("all") === "1" && (await isAdminRequest(req));
    const rows = await prisma.faq.findMany({
      where: includeDrafts ? {} : { published: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(rows);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const data = await parseBody(req, faqInput);
    return NextResponse.json(await prisma.faq.create({ data }), { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
