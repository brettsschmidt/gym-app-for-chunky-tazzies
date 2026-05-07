import { roundToIncrement } from "@/lib/units";

export interface WarmupSet {
  set_number: number;
  weight_kg: number;
  reps: number;
  percent: number;
}

/**
 * Default warmup ramp: 40% × 8, 60% × 5, 80% × 3 — rounded to the nearest
 * 2.5 kg so the bar's actually loadable. Skipped entirely for working
 * weights below 30 kg (just lift the bar).
 */
export function buildWarmupRamp(
  workingWeightKg: number,
  workingReps = 8,
): WarmupSet[] {
  if (workingWeightKg < 30) return [];
  const stages: Array<{ pct: number; reps: number }> = [
    { pct: 0.4, reps: Math.max(5, workingReps + 2) },
    { pct: 0.6, reps: Math.max(3, workingReps - 3) },
    { pct: 0.8, reps: Math.max(1, workingReps - 5) },
  ];
  return stages.map((s, i) => ({
    set_number: i + 1,
    weight_kg: roundToIncrement(workingWeightKg * s.pct, 2.5),
    reps: s.reps,
    percent: s.pct,
  }));
}
