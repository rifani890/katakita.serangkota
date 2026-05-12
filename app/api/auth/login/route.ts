import { NextResponse } from "next/server";
import { verifyUserPassword } from "@/lib/server/repositories/userRepository";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/lib/server/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || "").toString().trim();
    const password = (body.password || "").toString();

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }

    const user = await verifyUserPassword(email, password).catch((err) => {
      console.error("verifyUserPassword error:", err);
      return null;
    });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const sessionUser = {
      uid: user.id,
      email: user.email,
      nama: user.nama ?? null,
      role: user.role || "user",
    };

    const token = await createSessionToken(sessionUser);
    const response = NextResponse.json({ user: sessionUser });
    response.cookies.set(getSessionCookieName(), token, getSessionCookieOptions());

    return response;
  } catch (err) {
    console.error("/api/auth/login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
