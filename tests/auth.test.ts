import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { createSession, SESSION_COOKIE } from "../src/worker/security";

const origin = "https://example.com";

async function workerRequest(path: string, init?: RequestInit): Promise<Response> {
  return exports.default.fetch(new Request(`${origin}${path}`, init));
}

function cookieFrom(response: Response): string {
  const value = response.headers.get("Set-Cookie")?.split(";", 1)[0];
  if (!value) throw new Error("Expected session cookie");
  return value;
}

describe("family authentication", () => {
  it("creates a signed session for the correct PIN", async () => {
    const response = await workerRequest("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin, "CF-Connecting-IP": "192.0.2.10" },
      body: JSON.stringify({ pin: env.FAMILY_PIN }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Set-Cookie")).toContain(`${SESSION_COOKIE}=`);
    expect(response.headers.get("Set-Cookie")).toContain("HttpOnly");
    expect(response.headers.get("Set-Cookie")).toContain("Secure");
    const body = await response.json<{ authenticated: boolean; csrfToken: string }>();
    expect(body.authenticated).toBe(true);
    expect(body.csrfToken).toBeTruthy();
  });

  it("rejects an incorrect PIN without exposing secrets", async () => {
    const response = await workerRequest("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin, "CF-Connecting-IP": "192.0.2.11" },
      body: JSON.stringify({ pin: "000000" === env.FAMILY_PIN ? "999999" : "000000" }),
    });
    const text = await response.text();

    expect(response.status).toBe(401);
    expect(text).not.toContain(env.FAMILY_PIN);
    expect(text).not.toContain(env.SESSION_SECRET);
    expect(text).not.toContain(env.CLOUDFLARE_API_TOKEN);
  });

  it("limits a client after five failed attempts", async () => {
    const wrongPin = "111111" === env.FAMILY_PIN ? "222222" : "111111";
    let response: Response | undefined;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      response = await workerRequest("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: origin, "CF-Connecting-IP": "192.0.2.12" },
        body: JSON.stringify({ pin: wrongPin }),
      });
    }
    expect(response?.status).toBe(429);

    const blockedCorrectPin = await workerRequest("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin, "CF-Connecting-IP": "192.0.2.12" },
      body: JSON.stringify({ pin: env.FAMILY_PIN }),
    });
    expect(blockedCorrectPin.status).toBe(429);
  });

  it("rejects tampered and expired cookies", async () => {
    const valid = await createSession(env.SESSION_SECRET);
    const tampered = `${SESSION_COOKIE}=${valid.cookieValue.slice(0, -1)}x`;
    const tamperedResponse = await workerRequest("/api/auth/session", { headers: { Cookie: tampered } });
    await expect(tamperedResponse.json()).resolves.toEqual({ authenticated: false });

    const expired = await createSession(env.SESSION_SECRET, Date.now() - 31 * 24 * 60 * 60 * 1_000);
    const expiredResponse = await workerRequest("/api/auth/session", { headers: { Cookie: `${SESSION_COOKIE}=${expired.cookieValue}` } });
    await expect(expiredResponse.json()).resolves.toEqual({ authenticated: false });
  });

  it("logs out and clears the cookie", async () => {
    const session = await createSession(env.SESSION_SECRET);
    const response = await workerRequest("/api/auth/logout", {
      method: "POST",
      headers: { Cookie: `${SESSION_COOKIE}=${session.cookieValue}`, Origin: origin, "X-CSRF-Token": session.session.csrf },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Set-Cookie")).toContain("Max-Age=0");
  });

  it("rejects an unauthenticated call join", async () => {
    const response = await workerRequest("/api/call/join", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin, "X-CSRF-Token": "invalid" },
      body: JSON.stringify({ displayName: "Family member" }),
    });
    expect(response.status).toBe(401);
  });

  it("rejects an invalid display name", async () => {
    const session = await createSession(env.SESSION_SECRET);
    const response = await workerRequest("/api/call/join", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieFrom(new Response(null, { headers: { "Set-Cookie": `${SESSION_COOKIE}=${session.cookieValue}; Path=/` } })), Origin: origin, "X-CSRF-Token": session.session.csrf },
      body: JSON.stringify({ displayName: " ".repeat(41) }),
    });
    expect(response.status).toBe(400);
  });
});
