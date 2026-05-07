import type { ProgressionRule } from "@/lib/schemas/workouts";

export interface ProgressionInputs {
  rule: ProgressionRule;
  baseTargets: {
    target_weight_kg?: number | null;
    target_reps_min?: number | null;
    target_reps_max?: number | null;
  };
  lastSession?: {
    bestWeightKg?: number | null;
    bestReps?: number | null;
  };
  estimated1rm?: number | null;
}

export interface ProgressionSuggestion {
  target_weight_kg: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  rationale: string;
}

export function applyProgression({
  rule,
  baseTargets,
  lastSession,
  estimated1rm,
}: ProgressionInputs): ProgressionSuggestion {
  const fallback: ProgressionSuggestion = {
    target_weight_kg: baseTargets.target_weight_kg ?? null,
    target_reps_min: baseTargets.target_reps_min ?? null,
    target_reps_max: baseTargets.target_reps_max ?? null,
    rationale: "no progression",
  };

  if (rule.kind === "none") return fallback;

  if (rule.kind === "linear") {
    const base = lastSession?.bestWeightKg ?? baseTargets.target_weight_kg ?? 0;
    return {
      target_weight_kg: round(base + rule.weight_increment_kg, 0.5),
      target_reps_min: baseTargets.target_reps_min ?? null,
      target_reps_max: baseTargets.target_reps_max ?? null,
      rationale: `+${rule.weight_increment_kg} kg from last session`,
    };
  }

  if (rule.kind === "double_progression") {
    const reps = lastSession?.bestReps ?? null;
    const lastWeight = lastSession?.bestWeightKg ?? baseTargets.target_weight_kg ?? 0;
    const target = rule.rep_target;
    if (reps !== null && reps >= target) {
      return {
        target_weight_kg: round(lastWeight + rule.weight_increment_kg, 0.5),
        target_reps_min: baseTargets.target_reps_min ?? null,
        target_reps_max: baseTargets.target_reps_max ?? null,
        rationale: `hit ${target} reps — bump weight`,
      };
    }
    return {
      target_weight_kg: lastWeight,
      target_reps_min: baseTargets.target_reps_min ?? null,
      target_reps_max: baseTargets.target_reps_max ?? null,
      rationale: "add a rep before bumping weight",
    };
  }

  if (rule.kind === "percent_1rm") {
    if (estimated1rm) {
      return {
        target_weight_kg: round(estimated1rm * rule.percent, 0.5),
        target_reps_min: baseTargets.target_reps_min ?? null,
        target_reps_max: baseTargets.target_reps_max ?? null,
        rationale: `${Math.round(rule.percent * 100)}% of 1RM`,
      };
    }
    return fallback;
  }

  return fallback;
}

export function epley1RM(weightKg: number, reps: number): number {
  if (reps <= 0) return 0;
  return weightKg * (1 + reps / 30);
}

function round(value: number, step: number): number {
  return Math.round(value / step) * step;
}
