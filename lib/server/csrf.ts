import { cookies } from "next/headers";

const CSRF_COOKIE_NAME = "katakita_csrf";
const CSRF_MAX_AGE = 60 * 60; // 1 hour

/**
 * Generate a cryptographically secure CSRF token.
 */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Set CSRF token as HttpOnly cookie and return the token value.
 */
export function setCsrfCookie(token: string): void {
  const isProduction = process.env.NODE_ENV === "production";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const secure = isProduction && siteUrl.toLowerCase().startsWith("https://");

  cookies().set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: CSRF_MAX_AGE,
  });
}

/**
 * Validate the CSRF token from request body against the cookie.
 * Returns true if valid.
 */
export function validateCsrfToken(tokenFromBody: string | undefined): boolean {
  if (!tokenFromBody) return false;

  const cookieToken = cookies().get(CSRF_COOKIE_NAME)?.value;
  if (!cookieToken) return false;

  // Constant-time comparison to prevent timing attacks
  if (cookieToken.length !== tokenFromBody.length) return false;

  let mismatch = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    mismatch |= cookieToken.charCodeAt(i) ^ tokenFromBody.charCodeAt(i);
  }

  return mismatch === 0;
}

/**
 * Clear the CSRF cookie after successful validation.
 */
export function clearCsrfCookie(): void {
  cookies().delete(CSRF_COOKIE_NAME);
}
