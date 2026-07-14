import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("Worker foundation", () => {
  it("redirects the root page to the family page", async () => {
    const response = await exports.default.fetch(
      new Request("https://example.com/", { redirect: "manual" }),
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://example.com/family");
  });

  it("reports that the Worker and family room are healthy", async () => {
    const response = await exports.default.fetch(
      new Request("https://example.com/api/health"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok", room: "ok" });
  });
});
