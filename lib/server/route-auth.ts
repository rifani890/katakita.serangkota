import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, type SessionUser, verifySessionToken } from "@/lib/server/session";

export async function readSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(getSessionCookieName())?.value;
  return verifySessionToken(token);
}

export async function requireSessionUser() {
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
