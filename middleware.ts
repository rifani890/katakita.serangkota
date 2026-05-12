import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookieName, verifySessionToken } from "@/lib/server/session";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(getSessionCookieName())?.value;
  const user = await verifySessionToken(token);

  if (!user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const isKelolaAdmin =
    pathname === "/admin/kelola-admin" || pathname.startsWith("/admin/kelola-admin/");

  if (isKelolaAdmin && user.role !== "admin") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
