const AUTH_COOKIE_NAME = "katakita_session";
const AUTH_MAX_AGE_SECONDS = 8 * 60 * 60;

export interface SessionUser {
  uid: string;
  email: string;
  nama?: string | null;
  role: string;
}

interface SessionPayload extends SessionUser {
  exp: number;
}

function toBase64Url(input: string): string {
  return btoa(input)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
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

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getAuthSecret(): string {
  return process.env.AUTH_SECRET || "dev-only-change-me";
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
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );

  return bytesToBase64Url(new Uint8Array(signatureBuffer));
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + AUTH_MAX_AGE_SECONDS * 1000,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = await signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;

  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return null;

  const expectedSignature = await signValue(payloadPart);
  if (expectedSignature !== signaturePart) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(payloadPart)) as SessionPayload;
    if (!parsed.exp || parsed.exp < Date.now()) return null;

    return {
      uid: String(parsed.uid),
      email: parsed.email,
      nama: parsed.nama ?? null,
      role: parsed.role || "user",
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
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: AUTH_MAX_AGE_SECONDS,
  };
}

export function getSessionMaxAgeMs() {
  return AUTH_MAX_AGE_SECONDS * 1000;
}
