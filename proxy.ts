import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

// Next 16 renamed the `middleware` convention to `proxy` (runs on the Node.js runtime).
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect all /admin routes except /admin/login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get("admin_token")?.value;

    if (!token) {
      return redirectToLogin(req);
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return redirectToLogin(req);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
