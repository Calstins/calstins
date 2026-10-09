import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, parseBody, requireAdmin } from "@/lib/api";
import { reorderInput } from "@/lib/validation";
import { applyReorder } from "@/lib/reorder";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { ids } = await parseBody(req, reorderInput);
    return await applyReorder(prisma.service, ids);
  } catch (e) {
    return errorResponse(e);
  }
}
