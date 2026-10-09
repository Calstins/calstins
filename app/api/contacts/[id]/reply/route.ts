import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, errorResponse, parseBody, requireAdmin } from "@/lib/api";
import { getAdminFromRequest } from "@/lib/auth";
import { escapeHtml, isMailConfigured, sendMail } from "@/lib/mailer";
import { getPublicSettings } from "@/lib/settings";
import { isObjectId, replyInput } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

/** Email a reply to the person who used the contact form and keep it on the enquiry. */
export async function POST(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  try {
    const { id } = await params;
    if (!isObjectId(id)) throw new HttpError(404, "Enquiry not found");
    const input = await parseBody(req, replyInput);
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new HttpError(404, "Enquiry not found");

    if (!isMailConfigured()) {
      throw new HttpError(503, "Email sending is not configured on the server (set SMTP_HOST, SMTP_USER and SMTP_PASS). Use “Open in mail app” instead.");
    }
    const settings = await getPublicSettings();
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#172532">
      <p>${escapeHtml(input.message).replace(/\n/g, "<br />")}</p>
      <hr style="border:none;border-top:1px solid #ddd;margin:24px 0" />
      <p style="font-size:13px;color:#555">${escapeHtml(settings.companyName)} · ${escapeHtml(settings.city ?? "")}, ${escapeHtml(settings.country ?? "")}<br />${escapeHtml(settings.publicEmail ?? "")}</p>
      <p style="font-size:12px;color:#888">In reply to your enquiry:<br />“${escapeHtml(contact.message.slice(0, 400))}${contact.message.length > 400 ? "…" : ""}”</p>
    </div>`;
    try {
      await sendMail({ to: contact.email, subject: input.subject, html, text: input.message, replyTo: settings.publicEmail ?? undefined });
    } catch (e) {
      console.error("[contacts] reply email failed", e);
      throw new HttpError(502, "The email provider rejected the message. Nothing was recorded; try again or use your mail app.");
    }

    const admin = await getAdminFromRequest(req);
    const reply = { subject: input.subject, message: input.message, sentAt: new Date(), emailSent: true, sentBy: admin?.email ?? null };
    // Read-modify-write (no reliance on array push operators or transactions).
    const updated = await prisma.contact.update({
      where: { id },
      data: { replies: [...(contact.replies ?? []), reply], replied: true, read: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return errorResponse(e);
  }
}
