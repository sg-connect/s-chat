const encoder = new TextEncoder();

export const SESSION_COOKIE = "family_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const MAX_BODY_BYTES = 4_096;

export interface SessionData {
  csrf: string;
  exp: number;
  v: 1;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function hmac(value: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index];
  return mismatch === 0;
}

export async function timingSafeTextEqual(left: string, right: string, secret: string): Promise<boolean> {
  const [leftDigest, rightDigest] = await Promise.all([hmac(left, secret), hmac(right, secret)]);
  return equalBytes(leftDigest, rightDigest);
}

export async function clientIdentifier(request: Request, secret: string): Promise<string> {
  const trustedIp = request.headers.get("CF-Connecting-IP") ?? "local-development";
  return toBase64Url(await hmac(trustedIp, secret));
}

export async function createSession(secret: string, now = Date.now()): Promise<{ cookieValue: string; session: SessionData }> {
  const session: SessionData = {
    csrf: crypto.randomUUID(),
    exp: now + SESSION_MAX_AGE_SECONDS * 1_000,
    v: 1,
  };
  const payload = toBase64Url(encoder.encode(JSON.stringify(session)));
  const signature = toBase64Url(await hmac(payload, secret));
  return { cookieValue: `${payload}.${signature}`, session };
}

export async function verifySession(cookieValue: string | null, secret: string, now = Date.now()): Promise<SessionData | null> {
  if (!cookieValue) return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;
  const [payload, signatureText] = parts;
  const suppliedSignature = fromBase64Url(signatureText);
  const payloadBytes = fromBase64Url(payload);
  if (!suppliedSignature || !payloadBytes) return null;
  const expectedSignature = await hmac(payload, secret);
  if (!equalBytes(suppliedSignature, expectedSignature)) return null;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(payloadBytes)) as Partial<SessionData>;
    if (parsed.v !== 1 || typeof parsed.csrf !== "string" || typeof parsed.exp !== "number" || parsed.exp <= now) return null;
    return parsed as SessionData;
  } catch {
    return null;
  }
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  for (const item of header.split(";")) {
    const [cookieName, ...value] = item.trim().split("=");
    if (cookieName === name) return value.join("=");
  }
  return null;
}

export function sessionCookie(value: string, secure: boolean): string {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure ? "; Secure" : ""}`;
}

export function clearSessionCookie(secure: boolean): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}

export function isSecureRequest(request: Request, environment: string): boolean {
  return environment === "production" || new URL(request.url).protocol === "https:";
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  return origin !== null && origin === new URL(request.url).origin;
}

export function hasJsonContentType(request: Request): boolean {
  return request.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase() === "application/json";
}

export async function readJsonBody(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("Content-Length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) throw new Error("BODY_TOO_LARGE");
  const text = await request.text();
  if (encoder.encode(text).byteLength > MAX_BODY_BYTES) throw new Error("BODY_TOO_LARGE");
  return JSON.parse(text) as unknown;
}
