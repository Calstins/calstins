import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, isAuthConfigured, getAdminFromRequest } from "@/lib/auth";

const loginInput = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

const cookieOptions = {
  httpOnly: true,
  // `secure` cookies are dropped by browsers on plain-http origins (other than localhost). Allow an
  // explicit override for HTTP-only staging servers; production should always be https.
  secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "true",
  sameSite: "lax" as const,
  path: "/",
};

/** Who am I? Used by the admin UI and handy for debugging a deployment. */
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ authenticated: false, configured: isAuthConfigured() }, { status: 401 });
  return NextResponse.json({ authenticated: true, email: admin.email });
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthConfigured()) {
      console.error("[auth] JWT_SECRET is missing or shorter than 16 characters; login is disabled until it is set.");
      return NextResponse.json({ error: "Login is not configured on the server (JWT_SECRET missing or too short)." }, { status: 503 });
    }
    const parsed = loginInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    const { email, password } = parsed.data;

    const admin = await prisma.admin.findUnique({ where: { email } });
    // Same message and similar work for unknown email and wrong password.
    const valid = admin ? await bcrypt.compare(password, admin.password) : (await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi"), false);
    if (!admin || !valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = await signToken({ id: admin.id, email: admin.email });
    const res = NextResponse.json({ success: true, name: admin.name });
    res.cookies.set("admin_token", token, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (err) {
    console.error("[auth] login failed", err);
    return NextResponse.json({ error: "Could not reach the database. Check DATABASE_URL and that an admin exists (npm run admin:create)." }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set("admin_token", "", { ...cookieOptions, maxAge: 0 });
  return res;
}
