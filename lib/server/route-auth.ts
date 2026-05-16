import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, type SessionUser, verifySessionToken } from "@/lib/server/session";

/**
 * Validate X-Requested-With header for CSRF protection on mutation requests.
 * Browsers block cross-origin requests from setting custom headers without
 * a CORS preflight, so this effectively prevents CSRF from foreign sites.
 *
 * This is only called from requireSessionUser/requireAdminUser which are
 * exclusively used in mutation handlers (POST/PUT/DELETE).
 */
function validateCsrfHeader(): NextResponse | null {
  const reqHeaders = headers();

  if (reqHeaders.get("x-requested-with") !== "XMLHttpRequest") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

export async function readSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(getSessionCookieName())?.value;
  return verifySessionToken(token);
}

export async function requireSessionUser() {
  const csrfError = validateCsrfHeader();
  if (csrfError) {
    return { user: null, response: csrfError };
  }

  const user = await readSessionUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, response: null };
}

export async function requireAdminUser() {
  const result = await requireSessionUser();
  if (result.response) return result;

  if (result.user?.role !== "admin") {
    return {
      user: null,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return result;
}
