import { NextResponse } from "next/server";
import { verifyUserPassword } from "@/lib/server/repositories/userRepository";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/lib/server/session";

// In-memory rate limiting map
// NOTE: This works per-instance. For multi-instance, use Redis.
const rateLimit = new Map<string, { count: number; expiresAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || "").toString().trim();
    const password = (body.password || "").toString();

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }

    // Rate Limiting Logic based on Email
    const now = Date.now();
    const clientData = rateLimit.get(email);

    if (clientData && now < clientData.expiresAt) {
      if (clientData.count >= MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: "Terlalu banyak percobaan login. Silakan coba lagi nanti dalam 15 menit." },
          { status: 429 }
        );
      }
    } else if (clientData && now >= clientData.expiresAt) {
      // Reset if window has passed
      rateLimit.delete(email);
    }

    const user = await verifyUserPassword(email, password).catch((err) => {
      console.error("verifyUserPassword error:", err);
      return null;
    });
    if (!user) {
      // Record failed attempt
      const current = rateLimit.get(email) || { count: 0, expiresAt: now + WINDOW_MS };
      current.count += 1;
      rateLimit.set(email, current);

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Clear rate limit on success
    rateLimit.delete(email);

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
