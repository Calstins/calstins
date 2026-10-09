import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

// The signing secret is resolved lazily so `next build` never needs it, but a
// production runtime WITHOUT JWT_SECRET refuses to sign or verify anything
// (the previous hard-coded fallback let anyone forge an admin cookie).
function getSecret(): Uint8Array | null {
  const raw = process.env.JWT_SECRET;
  if (raw && raw.length >= 16) return new TextEncoder().encode(raw);
  if (process.env.NODE_ENV !== "production") {
    return new TextEncoder().encode("dev-only-secret-do-not-use-in-production");
  }
  return null;
}

export function isAuthConfigured() {
  return getSecret() !== null;
}

export async function signToken(payload: { id: string; email: string }) {
  const secret = getSecret();
  if (!secret) throw new Error("JWT_SECRET is not configured (min 16 characters)");
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string) {
  const secret = getSecret();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    return payload as unknown as { id: string; email: string };
  } catch {
    return null;
  }
}

export async function getAdminFromRequest(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
