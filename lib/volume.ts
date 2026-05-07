export function epley1RM(weightKg: number, reps: number): number {
  if (reps <= 0) return 0;
  return weightKg * (1 + reps / 30);
}

export interface SetLike {
  reps?: number | null;
  weight_kg?: number | null;
  is_warmup?: boolean | null;
  is_completed?: boolean | null;
}

export function totalTonnage(sets: SetLike[]): number {
  return sets.reduce((sum, s) => {
    if (s.is_warmup || !s.is_completed) return sum;
    const r = s.reps ?? 0;
    const w = s.weight_kg ?? 0;
    return sum + r * w;
  }, 0);
}

export function bestEstimated1RM(sets: SetLike[]): number {
  let best = 0;
  for (const s of sets) {
    if (s.is_warmup || !s.is_completed) continue;
    const r = s.reps ?? 0;
    const w = s.weight_kg ?? 0;
    if (r === 0 || w === 0) continue;
    const e = epley1RM(w, r);
    if (e > best) best = e;
  }
  return best;
}

export function workingSetCount(sets: SetLike[]): number {
  return sets.filter((s) => !s.is_warmup && s.is_completed).length;
}
