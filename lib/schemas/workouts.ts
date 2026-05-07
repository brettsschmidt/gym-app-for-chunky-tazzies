import { z } from "zod";

export const progressionRuleSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }),
  z.object({
    kind: z.literal("linear"),
    weight_increment_kg: z.number().positive().default(2.5),
    frequency: z.enum(["each_session", "each_week"]).default("each_session"),
  }),
  z.object({
    kind: z.literal("double_progression"),
    rep_target: z.number().int().positive().default(12),
    weight_increment_kg: z.number().positive().default(2.5),
  }),
  z.object({
    kind: z.literal("percent_1rm"),
    percent: z.number().positive().max(1.5).default(0.75),
  }),
]);
export type ProgressionRule = z.infer<typeof progressionRuleSchema>;

export const templateExerciseLineSchema = z.object({
  exercise_id: z.string().uuid(),
  position: z.number().int().min(0),
  target_sets: z.number().int().min(1).max(20).optional(),
  target_reps_min: z.number().int().min(1).max(100).optional(),
  target_reps_max: z.number().int().min(1).max(100).optional(),
  target_weight_kg: z.number().min(0).max(2000).optional(),
  target_rpe: z.number().min(0).max(10).optional(),
  rest_seconds: z.number().int().min(0).max(900).optional(),
  superset_group: z.number().int().min(0).max(20).optional(),
  progression_rule: progressionRuleSchema.default({ kind: "none" }),
});
export type TemplateExerciseLine = z.infer<typeof templateExerciseLineSchema>;

export const createTemplateSchema = z.object({
  chunky_tazzle_id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(2000).optional(),
  lines: z.array(templateExerciseLineSchema).default([]),
});
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const updateTemplateSchema = createTemplateSchema.extend({
  id: z.string().uuid(),
});
