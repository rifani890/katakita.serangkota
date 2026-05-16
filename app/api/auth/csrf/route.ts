import { NextResponse } from "next/server";
import { generateCsrfToken, setCsrfCookie } from "@/lib/server/csrf";

/**
 * GET /api/auth/csrf
 * Returns a CSRF token and sets it as an HttpOnly cookie.
 * The client sends the token back in the login request body for validation.
 */
export async function GET() {
  const token = generateCsrfToken();
  setCsrfCookie(token);

  return NextResponse.json({ csrfToken: token });
}
