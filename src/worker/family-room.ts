import { DurableObject } from "cloudflare:workers";
import { createMeeting, meetingIsUsable } from "./realtimekit";
import { timingSafeTextEqual } from "./security";

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1_000;

export interface PinResult {
  authenticated: boolean;
  limited: boolean;
}

export class FamilyRoom extends DurableObject<Env> {
  private meetingPromise: Promise<string> | undefined;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS room_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS pin_attempts (
        client_id TEXT PRIMARY KEY,
        failures INTEGER NOT NULL,
        window_started_at INTEGER NOT NULL,
        locked_until INTEGER NOT NULL
      )
    `);
  }

  ping(): string {
    return "ok";
  }

  async authenticatePin(clientId: string, submittedPin: string, now = Date.now()): Promise<PinResult> {
    const rows = this.ctx.storage.sql.exec<{
      failures: number;
      locked_until: number;
      window_started_at: number;
    }>("SELECT failures, locked_until, window_started_at FROM pin_attempts WHERE client_id = ?", clientId).toArray();
    const current = rows[0];
    if (current && current.locked_until > now) return { authenticated: false, limited: true };

    const matches = await timingSafeTextEqual(submittedPin, this.env.FAMILY_PIN, this.env.SESSION_SECRET);
    if (matches) {
      this.ctx.storage.sql.exec("DELETE FROM pin_attempts WHERE client_id = ?", clientId);
      return { authenticated: true, limited: false };
    }

    const windowExpired = !current || current.window_started_at + WINDOW_MS <= now;
    const failures = windowExpired ? 1 : current.failures + 1;
    const windowStartedAt = windowExpired ? now : current.window_started_at;
    const lockedUntil = failures >= MAX_FAILURES ? windowStartedAt + WINDOW_MS : 0;
    this.ctx.storage.sql.exec(
      `INSERT INTO pin_attempts (client_id, failures, window_started_at, locked_until)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(client_id) DO UPDATE SET failures = excluded.failures, window_started_at = excluded.window_started_at, locked_until = excluded.locked_until`,
      clientId,
      failures,
      windowStartedAt,
      lockedUntil,
    );
    return { authenticated: false, limited: failures >= MAX_FAILURES };
  }

  async getOrCreateMeeting(): Promise<string> {
    if (!this.meetingPromise) {
      this.meetingPromise = this.resolveMeeting().finally(() => {
        this.meetingPromise = undefined;
      });
    }
    return this.meetingPromise;
  }

  private async resolveMeeting(): Promise<string> {
    const rows = this.ctx.storage.sql.exec<{ value: string }>("SELECT value FROM room_state WHERE key = 'meeting_id'").toArray();
    const existingId = rows[0]?.value;
    if (existingId && await meetingIsUsable(this.env, existingId)) return existingId;

    const meetingId = await createMeeting(this.env);
    this.ctx.storage.sql.exec(
      `INSERT INTO room_state (key, value, updated_at) VALUES ('meeting_id', ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      meetingId,
      Date.now(),
    );
    return meetingId;
  }
}
