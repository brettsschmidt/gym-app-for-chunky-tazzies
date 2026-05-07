export type Sex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type Goal = "cut" | "maintain" | "bulk";

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Mifflin-St Jeor BMR (kcal/day). */
export function bmr(opts: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
}): number {
  const base = 10 * opts.weightKg + 6.25 * opts.heightCm - 5 * opts.ageYears;
  return opts.sex === "male" ? base + 5 : base - 161;
}

export function tdee(opts: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
  activity: ActivityLevel;
}): number {
  return bmr(opts) * ACTIVITY_FACTOR[opts.activity];
}

export interface MacroSplit {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

/**
 * Apply a goal modifier to TDEE then split macros:
 * - Protein anchored at 2g/kg of bodyweight (clamped 1.6–2.4)
 * - Fat ~25% of kcal
 * - Carbs fill the remainder
 * - Fiber 14g per 1000 kcal (rough USDA guideline)
 */
export function macrosForGoal(opts: {
  tdee: number;
  weightKg: number;
  goal: Goal;
}): MacroSplit {
  const adj =
    opts.goal === "cut" ? 0.8 : opts.goal === "bulk" ? 1.1 : 1.0;
  const kcal = Math.round(opts.tdee * adj);
  const protein_g = Math.round(opts.weightKg * 2);
  const fatKcal = kcal * 0.25;
  const fat_g = Math.round(fatKcal / 9);
  const remaining = kcal - protein_g * 4 - fat_g * 9;
  const carbs_g = Math.max(0, Math.round(remaining / 4));
  const fiber_g = Math.round((kcal / 1000) * 14);
  return { kcal, protein_g, carbs_g, fat_g, fiber_g };
}

export function hydrationTargetMl(weightKg: number): number {
  return Math.round(weightKg * 35);
}
