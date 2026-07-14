export { FamilyRoom } from "./family-room";

const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
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

    if (url.pathname.startsWith("/api/")) {
      return withSecurityHeaders(Response.json({ error: "Not found" }, { status: 404 }));
    }

    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
} satisfies ExportedHandler<Env>;
