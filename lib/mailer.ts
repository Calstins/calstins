import nodemailer from "nodemailer";

export const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function isMailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let cached: nodemailer.Transporter | null = null;
function transporter() {
  if (!cached) {
    const port = Number(process.env.SMTP_PORT) || 465;
    cached = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return cached;
}

/** Throws if SMTP is not configured or the provider rejects the message; callers decide how to surface it. */
export async function sendMail(opts: { to: string; subject: string; html: string; text?: string; replyTo?: string }) {
  if (!isMailConfigured()) throw new Error("Email is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS).");
  await transporter().sendMail({
    from: `"Calstins Ltd" <${process.env.SMTP_USER}>`,
    to: opts.to,
    subject: opts.subject.replace(/[\r\n]+/g, " "),
    html: opts.html,
    text: opts.text,
    replyTo: opts.replyTo,
  });
}
