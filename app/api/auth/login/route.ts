import { NextResponse } from "next/server";
import { verifyUserPassword } from "@/lib/server/repositories/userRepository";
import {
  createSessionToken,
  generatePwv,
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/lib/server/session";
import { validateCsrfToken, clearCsrfCookie } from "@/lib/server/csrf";

// ---------------------------------------------------------------------------
// Rate Limiting (per-IP) — max 5 attempts per 15 minutes
// ---------------------------------------------------------------------------
const ipRateLimit = new Map<string, { count: number; expiresAt: number }>();
const IP_MAX_ATTEMPTS = 5;
const IP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// ---------------------------------------------------------------------------
// Account Lockout (per-email) — lock after 10 failed attempts for 30 minutes
// ---------------------------------------------------------------------------
const accountLockout = new Map<string, { count: number; lockedUntil: number | null }>();
const LOCKOUT_THRESHOLD = 10;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// Generic error message to prevent user enumeration
const GENERIC_LOGIN_ERROR = "Email atau password tidak valid.";

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

function cleanupExpiredEntries() {
  const now = Date.now();
  Array.from(ipRateLimit.entries()).forEach(([key, data]) => {
    if (now >= data.expiresAt) ipRateLimit.delete(key);
  });
  Array.from(accountLockout.entries()).forEach(([key, data]) => {
    if (data.lockedUntil && now >= data.lockedUntil && data.count >= LOCKOUT_THRESHOLD) {
      accountLockout.delete(key);
    }
  });
}

export async function POST(req: Request) {
  try {
    // Periodic cleanup
    cleanupExpiredEntries();

    const body = await req.json();
    const email = (body.email || "").toString().trim().toLowerCase();
    const password = (body.password || "").toString();
    const csrfToken = (body.csrfToken || "").toString();

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
    }

    // -----------------------------------------------------------------------
    // IP-based Rate Limiting
    // -----------------------------------------------------------------------
    const clientIp = getClientIp(req);
    const now = Date.now();
    const ipData = ipRateLimit.get(clientIp);

    if (ipData && now < ipData.expiresAt && ipData.count >= IP_MAX_ATTEMPTS) {
      return NextResponse.json(
        {
          error: "Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.",
        },
        { status: 429 }
      );
    }

    // -----------------------------------------------------------------------
    // Account Lockout Check
    // -----------------------------------------------------------------------
    const acctData = accountLockout.get(email);
    if (acctData?.lockedUntil && now < acctData.lockedUntil) {
      const minutesLeft = Math.ceil((acctData.lockedUntil - now) / 60_000);
      return NextResponse.json(
        {
          error: `Akun dikunci sementara. Silakan coba lagi dalam ${minutesLeft} menit.`,
          code: "ACCOUNT_LOCKED",
        },
        { status: 429 }
      );
    }

    // -----------------------------------------------------------------------
    // Verify Credentials
    // -----------------------------------------------------------------------
    const user = await verifyUserPassword(email, password).catch(() => null);

    if (!user) {
      // Record failed attempt for IP
      const currentIp = ipRateLimit.get(clientIp) || {
        count: 0,
        expiresAt: now + IP_WINDOW_MS,
      };
      currentIp.count += 1;
      ipRateLimit.set(clientIp, currentIp);

      // Record failed attempt for account lockout
      const currentAcct = accountLockout.get(email) || {
        count: 0,
        lockedUntil: null,
      };
      currentAcct.count += 1;

      if (currentAcct.count >= LOCKOUT_THRESHOLD) {
        currentAcct.lockedUntil = now + LOCKOUT_DURATION_MS;
      }
      accountLockout.set(email, currentAcct);

      return NextResponse.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 });
    }

    // -----------------------------------------------------------------------
    // Success — clear rate limits & lockout, create session
    // -----------------------------------------------------------------------
    ipRateLimit.delete(clientIp);
    accountLockout.delete(email);
    clearCsrfCookie();

    const sessionUser = {
      uid: user.id,
      email: user.email,
      nama: user.nama ?? null,
      role: user.role || "user",
      pwv: await generatePwv(user.passwordHash),
    };

    const token = await createSessionToken(sessionUser);
    const response = NextResponse.json({ user: sessionUser });
    response.cookies.set(getSessionCookieName(), token, getSessionCookieOptions());

    return response;
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
