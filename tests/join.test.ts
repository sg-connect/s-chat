import { env, exports } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSession, SESSION_COOKIE } from "../src/worker/security";

const origin = "https://example.com";
const meetingId = "182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e";

afterEach(() => vi.unstubAllGlobals());

describe("RealtimeKit joining", () => {
  it("creates a meeting and a unique participant", async () => {
    const mockedFetch = vi.fn((input: RequestInfo | URL) => {
      const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
      if (url.pathname.endsWith("/meetings")) return Promise.resolve(Response.json({ success: true, data: { id: meetingId } }));
      if (url.pathname.endsWith(`/meetings/${meetingId}/participants`)) return Promise.resolve(Response.json({ success: true, data: { id: "participant-1", token: "browser-safe-token" } }));
      return Promise.resolve(new Response(null, { status: 404 }));
    });
    vi.stubGlobal("fetch", mockedFetch);

    const session = await createSession(env.SESSION_SECRET);
    const response = await exports.default.fetch(new Request(`${origin}/api/call/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${SESSION_COOKIE}=${session.cookieValue}`,
        Origin: origin,
        "X-CSRF-Token": session.session.csrf,
      },
      body: JSON.stringify({ displayName: "Mary" }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ token: "browser-safe-token" });
    expect(mockedFetch).toHaveBeenCalledTimes(2);
  });
});
