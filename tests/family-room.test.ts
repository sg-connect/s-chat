import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";

const meetingId = "282bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e";

afterEach(() => vi.unstubAllGlobals());

describe("FamilyRoom meeting coordination", () => {
  it("reuses one meeting for simultaneous requests", async () => {
    const mockedFetch = vi.fn(() => Promise.resolve(Response.json({ success: true, data: { id: meetingId } })));
    vi.stubGlobal("fetch", mockedFetch);

    const room = env.FAMILY_ROOM.getByName("concurrency-test");
    const [first, second] = await Promise.all([room.getOrCreateMeeting(), room.getOrCreateMeeting()]);

    expect(first).toBe(meetingId);
    expect(second).toBe(meetingId);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });
});
