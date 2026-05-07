import { z } from "zod";

export const SET_KINDS = [
  "working",
  "warmup",
  "drop",
  "cluster",
  "rest_pause",
  "amrap",
] as const;
export const setKindSchema = z.enum(SET_KINDS);
export type SetKind = z.infer<typeof setKindSchema>;

export const startSessionSchema = z.object({
  chunky_tazzle_id: z.string().uuid(),
  workout_template_id: z.string().uuid().optional(),
});

export const finishSessionSchema = z.object({
  id: z.string().uuid(),
  bodyweight_kg: z.coerce.number().positive().optional(),
  perceived_effort: z.coerce.number().int().min(1).max(10).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const setRowSchema = z.object({
  session_exercise_id: z.string().uuid(),
  set_number: z.coerce.number().int().min(1),
  reps: z.coerce.number().int().min(0).max(500).optional(),
  weight_kg: z.coerce.number().min(0).max(2000).optional(),
  rpe: z.coerce.number().min(0).max(10).optional(),
  rir: z.coerce.number().int().min(0).max(10).optional(),
  is_warmup: z.coerce.boolean().optional(),
  is_completed: z.coerce.boolean().optional(),
  failed_at_set: z.coerce.boolean().optional(),
  set_kind: setKindSchema.optional(),
  parent_set_id: z.string().uuid().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const upsertSetSchema = setRowSchema.extend({
  id: z.string().uuid().optional(),
});

export const repeatLastSetSchema = z.object({
  session_exercise_id: z.string().uuid(),
});

export const insertWarmupSchema = z.object({
  session_exercise_id: z.string().uuid(),
  working_weight_kg: z.coerce.number().positive(),
  working_reps: z.coerce.number().int().positive().default(8),
});

export const copyLastSessionSchema = z.object({
  workout_template_id: z.string().uuid(),
  chunky_tazzle_id: z.string().uuid(),
});
