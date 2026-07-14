import { z } from "zod";

const API_ROOT = "https://api.cloudflare.com/client/v4";
const API_TIMEOUT_MS = 10_000;

const meetingResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ id: z.string().uuid() }),
});

const participantResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ id: z.string(), token: z.string().min(1) }),
});

export class RealtimeKitError extends Error {
  constructor(public readonly status: number, message = "RealtimeKit request failed") {
    super(message);
  }
}

function baseUrl(env: Env): string {
  return `${API_ROOT}/accounts/${encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID)}/realtime/kit/${encodeURIComponent(env.REALTIMEKIT_APP_ID)}`;
}

async function apiRequest(env: Env, path: string, init: RequestInit): Promise<Response> {
  const signal = AbortSignal.timeout(API_TIMEOUT_MS);
  return fetch(`${baseUrl(env)}${path}`, {
    ...init,
    signal,
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

export async function meetingIsUsable(env: Env, meetingId: string): Promise<boolean> {
  const response = await apiRequest(env, `/meetings/${encodeURIComponent(meetingId)}`, { method: "GET" });
  if (response.status === 404 || response.status === 410) return false;
  if (!response.ok) throw new RealtimeKitError(response.status);
  const payload = await response.json();
  return meetingResponseSchema.safeParse(payload).success;
}

export async function createMeeting(env: Env): Promise<string> {
  const response = await apiRequest(env, "/meetings", {
    method: "POST",
    body: JSON.stringify({
      title: "Family Call",
      persist_chat: false,
      record_on_start: false,
    }),
  });
  if (!response.ok) throw new RealtimeKitError(response.status);
  const parsed = meetingResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new RealtimeKitError(502, "Invalid meeting response");
  return parsed.data.data.id;
}

export async function addParticipant(env: Env, meetingId: string, displayName: string): Promise<{ participantId: string; token: string }> {
  const response = await apiRequest(env, `/meetings/${encodeURIComponent(meetingId)}/participants`, {
    method: "POST",
    body: JSON.stringify({
      name: displayName,
      preset_name: env.REALTIMEKIT_PRESET_NAME,
      custom_participant_id: crypto.randomUUID(),
    }),
  });
  if (!response.ok) throw new RealtimeKitError(response.status);
  const parsed = participantResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new RealtimeKitError(502, "Invalid participant response");
  return { participantId: parsed.data.data.id, token: parsed.data.data.token };
}
