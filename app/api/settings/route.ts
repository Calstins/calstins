import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, isAdminRequest, parseBody, requireAdmin } from "@/lib/api";
import { settingsInput } from "@/lib/validation";
import { SETTINGS_KEY, getSettingsRow, toPublicSettings } from "@/lib/settings";

export async function GET(req: NextRequest) {
  try {
    const row = await getSettingsRow();
    // Admins get the raw record (including an unverified number); everyone else the public projection.
    if ((await isAdminRequest(req)) && new URL(req.url).searchParams.get("raw") === "1") {
      return NextResponse.json(row ?? { key: SETTINGS_KEY });
    }
    return NextResponse.json(toPublicSettings(row));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const data = await parseBody(req, settingsInput);
    const existing = await prisma.companySettings.findUnique({ where: { key: SETTINGS_KEY }, select: { id: true } });
    const saved = existing
      ? await prisma.companySettings.update({ where: { id: existing.id }, data })
      : await prisma.companySettings.create({ data: { key: SETTINGS_KEY, ...data } });
    return NextResponse.json(saved);
  } catch (e) {
    return errorResponse(e);
  }
}
