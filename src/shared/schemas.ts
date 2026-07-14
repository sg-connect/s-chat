import { z } from "zod";

export const pinRequestSchema = z.object({
  pin: z.string().regex(/^\d{6}$/),
}).strict();

export const joinRequestSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
}).strict();

export type JoinRequest = z.infer<typeof joinRequestSchema>;
