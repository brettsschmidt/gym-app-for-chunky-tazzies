import { z } from "zod";

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
  is_warmup: z.coerce.boolean().optional(),
  is_completed: z.coerce.boolean().optional(),
});

export const upsertSetSchema = setRowSchema.extend({
  id: z.string().uuid().optional(),
});
