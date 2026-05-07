import type { ProgressionRule } from "@/lib/schemas/workouts";

export type ProgramGoal = "strength" | "hypertrophy" | "general";
export type Experience = "beginner" | "intermediate" | "advanced";

export interface GeneratedExercise {
  exercise_slug: string;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  target_rpe?: number;
  rest_seconds: number;
  progression_rule?: ProgressionRule;
}

export interface GeneratedTemplate {
  name: string;
  exercises: GeneratedExercise[];
}

export interface GeneratedProgram {
  name: string;
  description: string;
  weeks_count: number;
  templates: GeneratedTemplate[];
  /** day_of_week (0–6) → index into templates */
  schedule: Record<number, number>;
}

export function generateProgram(opts: {
  goal: ProgramGoal;
  experience: Experience;
  daysPerWeek: number;
}): GeneratedProgram {
  const { goal, experience, daysPerWeek } = opts;
  const linear: ProgressionRule = {
    kind: "linear",
    weight_increment_kg: experience === "beginner" ? 2.5 : 1.25,
    frequency: "each_session",
  };
  const doubleProg: ProgressionRule = {
    kind: "double_progression",
    rep_target: 12,
    weight_increment_kg: 2.5,
  };
  const repRange =
    goal === "strength"
      ? { min: 3, max: 5, sets: 5, rest: 180, rpe: 8 }
      : goal === "hypertrophy"
        ? { min: 8, max: 12, sets: 4, rest: 90, rpe: 9 }
        : { min: 6, max: 10, sets: 3, rest: 120, rpe: 8 };

  const upper: GeneratedTemplate = {
    name: "Upper",
    exercises: [
      {
        exercise_slug: "bench-press",
        target_sets: repRange.sets,
        target_reps_min: repRange.min,
        target_reps_max: repRange.max,
        target_rpe: repRange.rpe,
        rest_seconds: repRange.rest,
        progression_rule: goal === "strength" ? linear : doubleProg,
      },
      {
        exercise_slug: "overhead-press",
        target_sets: repRange.sets,
        target_reps_min: repRange.min,
        target_reps_max: repRange.max,
        rest_seconds: repRange.rest,
        progression_rule: linear,
      },
      {
        exercise_slug: "barbell-row",
        target_sets: repRange.sets,
        target_reps_min: repRange.min,
        target_reps_max: repRange.max,
        rest_seconds: repRange.rest,
      },
      {
        exercise_slug: "pull-up",
        target_sets: 3,
        target_reps_min: 5,
        target_reps_max: 12,
        rest_seconds: 90,
      },
    ],
  };

  const lower: GeneratedTemplate = {
    name: "Lower",
    exercises: [
      {
        exercise_slug: "back-squat",
        target_sets: repRange.sets,
        target_reps_min: repRange.min,
        target_reps_max: repRange.max,
        target_rpe: repRange.rpe,
        rest_seconds: repRange.rest,
        progression_rule: goal === "strength" ? linear : doubleProg,
      },
      {
        exercise_slug: "deadlift",
        target_sets: 3,
        target_reps_min: 3,
        target_reps_max: 5,
        target_rpe: 8,
        rest_seconds: 240,
        progression_rule: linear,
      },
      {
        exercise_slug: "romanian-deadlift",
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 10,
        rest_seconds: 120,
      },
      {
        exercise_slug: "leg-press",
        target_sets: 3,
        target_reps_min: 10,
        target_reps_max: 12,
        rest_seconds: 90,
      },
    ],
  };

  const push: GeneratedTemplate = {
    name: "Push",
    exercises: [
      { exercise_slug: "bench-press", target_sets: repRange.sets, target_reps_min: repRange.min, target_reps_max: repRange.max, rest_seconds: repRange.rest, progression_rule: doubleProg },
      { exercise_slug: "overhead-press", target_sets: 4, target_reps_min: 6, target_reps_max: 10, rest_seconds: 120 },
      { exercise_slug: "incline-dumbbell-press", target_sets: 3, target_reps_min: 8, target_reps_max: 12, rest_seconds: 90 },
      { exercise_slug: "tricep-pushdown", target_sets: 3, target_reps_min: 10, target_reps_max: 15, rest_seconds: 60 },
    ],
  };
  const pull: GeneratedTemplate = {
    name: "Pull",
    exercises: [
      { exercise_slug: "deadlift", target_sets: 3, target_reps_min: 3, target_reps_max: 5, rest_seconds: 240, progression_rule: linear },
      { exercise_slug: "barbell-row", target_sets: 4, target_reps_min: 6, target_reps_max: 10, rest_seconds: 120 },
      { exercise_slug: "pull-up", target_sets: 3, target_reps_min: 6, target_reps_max: 12, rest_seconds: 90 },
      { exercise_slug: "barbell-curl", target_sets: 3, target_reps_min: 8, target_reps_max: 12, rest_seconds: 60 },
    ],
  };
  const legs: GeneratedTemplate = {
    name: "Legs",
    exercises: [
      { exercise_slug: "back-squat", target_sets: repRange.sets, target_reps_min: repRange.min, target_reps_max: repRange.max, rest_seconds: repRange.rest, progression_rule: linear },
      { exercise_slug: "romanian-deadlift", target_sets: 3, target_reps_min: 8, target_reps_max: 10, rest_seconds: 120 },
      { exercise_slug: "leg-press", target_sets: 3, target_reps_min: 10, target_reps_max: 12, rest_seconds: 90 },
      { exercise_slug: "calf-raise", target_sets: 3, target_reps_min: 12, target_reps_max: 20, rest_seconds: 60 },
    ],
  };

  let templates: GeneratedTemplate[];
  let schedule: Record<number, number>;
  if (daysPerWeek <= 3) {
    templates = [upper, lower, upper];
    schedule = { 1: 0, 3: 1, 5: 2 };
  } else if (daysPerWeek === 4) {
    templates = [upper, lower];
    schedule = { 1: 0, 2: 1, 4: 0, 5: 1 };
  } else {
    templates = [push, pull, legs];
    if (daysPerWeek === 5) schedule = { 1: 0, 2: 1, 4: 2, 5: 0, 6: 1 };
    else schedule = { 1: 0, 2: 1, 3: 2, 4: 0, 5: 1, 6: 2 };
  }

  const description =
    goal === "strength"
      ? `Heavy 3-5 rep blocks with linear progression (${experience}). ${daysPerWeek} days/week.`
      : goal === "hypertrophy"
        ? `Higher-volume 8-12 rep blocks with double progression. ${daysPerWeek} days/week.`
        : `Balanced 6-10 rep work, mix of progression styles. ${daysPerWeek} days/week.`;

  return {
    name: `${goal[0].toUpperCase() + goal.slice(1)} ${daysPerWeek}d`,
    description,
    weeks_count: 8,
    templates,
    schedule,
  };
}
