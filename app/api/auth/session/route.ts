import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  createSessionToken,
  generatePwv,
  getSessionCookieName,
  getSessionCookieOptions,
  verifySessionToken,
  revokeSessionToken,
} from "@/lib/server/session";
import { findUserByEmail } from "@/lib/server/repositories/userRepository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const token = cookies().get(getSessionCookieName())?.value;
    const user = await verifySessionToken(token);

    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Absolute session lifetime check (12 hours)
    const ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000;
    if (user.iat && Date.now() - user.iat > ABSOLUTE_TIMEOUT_MS) {
      const response = NextResponse.json({ user: null, error: "Session expired" });
      response.cookies.set(getSessionCookieName(), "", {
        ...getSessionCookieOptions(),
        maxAge: 0,
        expires: new Date(0),
      });
      return response;
    }

    // Verify password version — invalidate session if password was changed
    if (user.pwv) {
      const dbUser = await findUserByEmail(user.email);
      if (dbUser) {
        const currentPwv = await generatePwv(dbUser.passwordHash);
        if (currentPwv !== user.pwv) {
          // Password was changed — invalidate this session
          const response = NextResponse.json({ user: null });
          response.cookies.set(getSessionCookieName(), "", {
            ...getSessionCookieOptions(),
            maxAge: 0,
            expires: new Date(0),
          });
          return response;
        }
      }
    }

    const refreshedToken = await createSessionToken(user);
    const response = NextResponse.json({ user });
    response.cookies.set(getSessionCookieName(), refreshedToken, getSessionCookieOptions());

    return response;
  } catch (err) {
    logger.error("/api/auth/session GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  // Prevent CSRF on logout
  if (req.headers.get("x-requested-with") !== "XMLHttpRequest") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cookieStore = cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (token) {
    revokeSessionToken(token);
  }

  const response = NextResponse.json({ message: "Logout berhasil" });
  response.cookies.set(getSessionCookieName(), "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
