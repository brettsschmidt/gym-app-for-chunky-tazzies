import { z } from "zod";

export const exerciseInputSchema = z.object({
  chunky_tazzle_id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  instructions: z.string().trim().max(4000).optional().or(z.literal("")),
  video_url: z.string().trim().url().optional().or(z.literal("")),
  primary_muscle_id: z.string().uuid().optional().or(z.literal("")),
  equipment_id: z.string().uuid().optional().or(z.literal("")),
  is_unilateral: z.coerce.boolean().optional(),
});
export type ExerciseInput = z.infer<typeof exerciseInputSchema>;
