import { z } from "zod";

export const createShareSchema = z.object({
  kind: z.enum(["template", "program", "session", "recipe"]),
  subject_id: z.string().uuid(),
  chunky_tazzle_id: z.string().uuid().optional(),
  expires_in_days: z.coerce.number().int().min(1).max(365).optional(),
});

export const revokeShareSchema = z.object({
  id: z.string().uuid(),
});
