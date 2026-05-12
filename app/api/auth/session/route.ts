import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionCookieOptions,
  verifySessionToken,
} from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const token = cookies().get(getSessionCookieName())?.value;
    const user = await verifySessionToken(token);

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const refreshedToken = await createSessionToken(user);
    const response = NextResponse.json({ user });
    response.cookies.set(
      getSessionCookieName(),
      refreshedToken,
      getSessionCookieOptions()
    );

    return response;
  } catch (err) {
    console.error("/api/auth/session GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ message: "Logout berhasil" });
  response.cookies.set(getSessionCookieName(), "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
