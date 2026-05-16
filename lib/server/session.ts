const AUTH_COOKIE_NAME = "katakita_session";
const AUTH_MAX_AGE_SECONDS = 60 * 60; // 60 Menit

export interface SessionUser {
  uid: string;
  email: string;
  nama?: string | null;
  role: string;
  /** Password version — short hash of the bcrypt hash, used to invalidate sessions on password change */
  pwv?: string | null;
  /** Issued at timestamp (ms) to enforce absolute session lifetime */
  iat?: number;
}

interface SessionPayload extends SessionUser {
  exp: number;
}

function toBase64Url(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
  return atob(padded);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret === "dev-only-change-me") {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FATAL: AUTH_SECRET environment variable is not set or is using the default dev value. " +
        "Set a strong, random AUTH_SECRET in your hosting provider's environment variables."
      );
    }
    return "dev-only-change-me";
  }
  return secret;
}

async function importSecretKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signValue(value: string): Promise<string> {
  const key = await importSecretKey();
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));

  return bytesToBase64Url(new Uint8Array(signatureBuffer));
}

/**
 * Generate a short password version identifier from the password hash.
 * Used to invalidate sessions when the password changes.
 */
export async function generatePwv(passwordHash: string | null | undefined): Promise<string> {
  if (!passwordHash) return "";
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(passwordHash));
  return bytesToBase64Url(new Uint8Array(hash)).slice(0, 8);
}

// In-memory blacklist for revoked tokens (best-effort for Edge/Serverless)
const revokedTokens = new Set<string>();

export function revokeSessionToken(token: string) {
  if (!token) return;
  revokedTokens.add(token);
  // Basic memory management: prevent Set from growing indefinitely
  if (revokedTokens.size > 10000) {
    const iterator = revokedTokens.values();
    for (let i = 0; i < 1000; i++) {
      const nextVal = iterator.next().value;
      if (nextVal !== undefined) {
        revokedTokens.delete(nextVal);
      }
    }
  }
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const payload: SessionPayload = {
    ...user,
    iat: user.iat || Date.now(),
    exp: Date.now() + AUTH_MAX_AGE_SECONDS * 1000,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = await signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionUser | null> {
  if (!token) return null;
  if (revokedTokens.has(token)) return null;

  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return null;

  const expectedSignature = await signValue(payloadPart);

  // Constant-time comparison to prevent timing attacks in Edge Runtime
  if (expectedSignature.length !== signaturePart.length) return null;
  let result = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    result |= expectedSignature.charCodeAt(i) ^ signaturePart.charCodeAt(i);
  }
  if (result !== 0) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(payloadPart)) as SessionPayload;
    if (!parsed.exp || parsed.exp < Date.now()) return null;

    return {
      uid: String(parsed.uid),
      email: parsed.email,
      nama: parsed.nama ?? null,
      role: parsed.role || "user",
      pwv: parsed.pwv ?? null,
      iat: parsed.iat,
    };
  } catch {
    return null;
  }
}

export function getSessionCookieName() {
  return AUTH_COOKIE_NAME;
}

export function getSessionCookieOptions() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "";
  const isProduction = process.env.NODE_ENV === "production";
  const secure =
    process.env.FORCE_SECURE_COOKIES === "true" ||
    (isProduction && siteUrl.toLowerCase().startsWith("https://"));

  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure,
    path: "/",
    maxAge: AUTH_MAX_AGE_SECONDS,
  };
}

export function getSessionMaxAgeMs() {
  return AUTH_MAX_AGE_SECONDS * 1000;
}
