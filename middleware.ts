import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookieName, verifySessionToken } from "@/lib/server/session";

// In-memory rate limiting map for middleware (per-instance)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_API_REQUESTS = 100; // 100 requests per minute

function cleanupRateLimit() {
  const now = Date.now();
  rateLimitMap.forEach((data, key) => {
    if (now >= data.expiresAt) rateLimitMap.delete(key);
  });
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const ip =
    request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  // Rate Limiting for all API routes
  if (pathname.startsWith("/api/")) {
    if (Math.random() < 0.05) cleanupRateLimit(); // Periodic cleanup

    const now = Date.now();
    const clientData = rateLimitMap.get(ip) || { count: 0, expiresAt: now + RATE_LIMIT_WINDOW };

    if (now > clientData.expiresAt) {
      clientData.count = 1;
      clientData.expiresAt = now + RATE_LIMIT_WINDOW;
    } else {
      clientData.count += 1;
    }

    rateLimitMap.set(ip, clientData);

    if (clientData.count > MAX_API_REQUESTS) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  // Auth checks for admin/dashboard routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
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
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/api/:path*"],
};
