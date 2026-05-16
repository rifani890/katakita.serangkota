import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL || "https://katakita-serangkota.vercel.app",
].filter(Boolean);

/**
 * Add CORS headers to a NextResponse.
 * Only allows requests from the configured production domain.
 */
export function withCors(response: NextResponse, origin: string | null): NextResponse {
  const isAllowed = origin && ALLOWED_ORIGINS.some((allowed) => origin === allowed);

  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin!);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400");
  }

  return response;
}

/**
 * Handle CORS preflight OPTIONS request.
 */
export function handleCorsOptions(origin: string | null): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return withCors(response, origin);
}
