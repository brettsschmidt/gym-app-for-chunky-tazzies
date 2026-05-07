import { z } from "zod";

export const createProgramSchema = z.object({
  chunky_tazzle_id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  weeks_count: z.coerce.number().int().min(1).max(52).default(4),
});

export const programWorkoutSchema = z.object({
  program_id: z.string().uuid(),
  week_number: z.coerce.number().int().min(1),
  day_of_week: z.coerce.number().int().min(0).max(6),
  workout_template_id: z.string().uuid(),
  position: z.coerce.number().int().min(0).default(0),
});
