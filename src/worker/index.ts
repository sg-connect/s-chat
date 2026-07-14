export { FamilyRoom } from "./family-room";

import { joinRequestSchema, pinRequestSchema } from "../shared/schemas";
import { addParticipant, RealtimeKitError } from "./realtimekit";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  clientIdentifier,
  createSession,
  hasJsonContentType,
  isSameOrigin,
  isSecureRequest,
  readCookie,
  readJsonBody,
  sessionCookie,
  verifySession,
} from "./security";

const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https: wss:; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  "Permissions-Policy": "camera=(self), microphone=(self), display-capture=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function json(data: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  return Response.json(data, { status, headers: extraHeaders });
}

function familyRoom(env: Env) {
  return env.FAMILY_ROOM.getByName("family");
}

async function requireSession(request: Request, env: Env) {
  return verifySession(readCookie(request, SESSION_COOKIE), env.SESSION_SECRET);
}

async function handlePin(request: Request, env: Env): Promise<Response> {
  if (!isSameOrigin(request)) return json({ error: "Request not allowed" }, 403);
  if (!hasJsonContentType(request)) return json({ error: "Expected JSON" }, 415);
  let body: unknown;
  try { body = await readJsonBody(request); } catch { return json({ error: "Invalid request" }, 400); }
  const parsed = pinRequestSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Enter a six-digit PIN" }, 400);

  const clientId = await clientIdentifier(request, env.SESSION_SECRET);
  const result = await familyRoom(env).authenticatePin(clientId, parsed.data.pin);
  if (!result.authenticated) {
    return result.limited
      ? json({ error: "Temporarily unable to try again" }, 429)
      : json({ error: "Incorrect PIN" }, 401);
  }

  const { cookieValue, session } = await createSession(env.SESSION_SECRET);
  return json(
    { authenticated: true, csrfToken: session.csrf },
    200,
    { "Set-Cookie": sessionCookie(cookieValue, isSecureRequest(request, env.ENVIRONMENT)) },
  );
}

async function handleSession(request: Request, env: Env): Promise<Response> {
  const session = await requireSession(request, env);
  return session
    ? json({ authenticated: true, csrfToken: session.csrf })
    : json({ authenticated: false });
}

async function handleLogout(request: Request, env: Env): Promise<Response> {
  if (!isSameOrigin(request)) return json({ error: "Request not allowed" }, 403);
  const session = await requireSession(request, env);
  if (session && request.headers.get("X-CSRF-Token") !== session.csrf) return json({ error: "Request not allowed" }, 403);
  return json(
    { authenticated: false },
    200,
    { "Set-Cookie": clearSessionCookie(isSecureRequest(request, env.ENVIRONMENT)) },
  );
}

async function handleJoin(request: Request, env: Env): Promise<Response> {
  if (!isSameOrigin(request)) return json({ error: "Request not allowed" }, 403);
  const session = await requireSession(request, env);
  if (!session) return json({ error: "Your family access has expired" }, 401);
  if (request.headers.get("X-CSRF-Token") !== session.csrf) return json({ error: "Request not allowed" }, 403);
  if (!hasJsonContentType(request)) return json({ error: "Expected JSON" }, 415);
  let body: unknown;
  try { body = await readJsonBody(request); } catch { return json({ error: "Invalid request" }, 400); }
  const parsed = joinRequestSchema.safeParse(body);
  if (!parsed.success) return json({ error: "Enter a name between 1 and 40 characters" }, 400);

  try {
    const meetingId = await familyRoom(env).getOrCreateMeeting();
    const participant = await addParticipant(env, meetingId, parsed.data.displayName);
    return json({ token: participant.token });
  } catch (error) {
    const status = error instanceof RealtimeKitError && error.status === 401 ? 503 : 502;
    console.error(JSON.stringify({ message: "RealtimeKit join failed", kind: error instanceof RealtimeKitError ? "api" : "unexpected" }));
    return json({ error: "Unable to join the family call right now" }, status);
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return withSecurityHeaders(Response.redirect(new URL("/family", url), 302));
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      const room = env.FAMILY_ROOM.getByName("family");
      const roomStatus = await room.ping();
      return withSecurityHeaders(Response.json({ status: "ok", room: roomStatus }));
    }

    if (url.pathname === "/api/auth/pin" && request.method === "POST") return withSecurityHeaders(await handlePin(request, env));
    if (url.pathname === "/api/auth/session" && request.method === "GET") return withSecurityHeaders(await handleSession(request, env));
    if (url.pathname === "/api/auth/logout" && request.method === "POST") return withSecurityHeaders(await handleLogout(request, env));
    if (url.pathname === "/api/call/join" && request.method === "POST") return withSecurityHeaders(await handleJoin(request, env));

    if (url.pathname.startsWith("/api/")) {
      return withSecurityHeaders(Response.json({ error: "Not found" }, { status: 404 }));
    }

    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
} satisfies ExportedHandler<Env>;
