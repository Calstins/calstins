import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin } from "@/lib/api";
import { escapeHtml, isMailConfigured, sendMail } from "@/lib/mailer";

const esc = escapeHtml;

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  service: z.string().optional(),
  budget: z.string().optional(),
  message: z.string().min(10),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Honeypot: real visitors never see or fill this field. Pretend success so bots learn nothing.
    if (typeof body?.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ success: true });
    }
    const data = contactSchema.parse(body);
    const contact = await prisma.contact.create({ data });

    // Notify via email
    try {
      if (!isMailConfigured() || !process.env.CONTACT_EMAIL) throw new Error("mail not configured");
      await sendMail({
        replyTo: data.email,
        to: process.env.CONTACT_EMAIL,
        subject: `New Contact: ${data.name.replace(/[\r\n]+/g, " ")} — ${(data.service || "General").replace(/[\r\n]+/g, " ")}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${esc(data.name)}</p>
          <p><strong>Email:</strong> ${esc(data.email)}</p>
          <p><strong>Phone:</strong> ${esc(data.phone || "—")}</p>
          <p><strong>Company:</strong> ${esc(data.company || "—")}</p>
          <p><strong>Service:</strong> ${esc(data.service || "—")}</p>
          <p><strong>Budget:</strong> ${esc(data.budget || "—")}</p>
          <p><strong>Message:</strong></p>
          <p>${esc(data.message).replace(/\n/g, "<br />")}</p>
        `,
      });
    } catch (emailErr) {
      console.error("Email failed:", emailErr);
    }

    return NextResponse.json({ success: true, id: contact.id });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input", details: err.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Contacts hold personal data; the middleware only guards /admin pages, so check here.
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(contacts);
}
