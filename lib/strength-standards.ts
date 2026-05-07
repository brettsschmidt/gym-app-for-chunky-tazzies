export type Sex = "male" | "female";
export type Tier =
  | "untrained"
  | "novice"
  | "intermediate"
  | "advanced"
  | "elite";

export interface StandardRow {
  exercise_slug: string;
  sex: Sex;
  bodyweight_band: string;
  untrained: number;
  novice: number;
  intermediate: number;
  advanced: number;
  elite: number;
}

export function classifyLift(
  bestKg: number,
  row: StandardRow | null,
): Tier | null {
  if (!row) return null;
  if (bestKg >= row.elite) return "elite";
  if (bestKg >= row.advanced) return "advanced";
  if (bestKg >= row.intermediate) return "intermediate";
  if (bestKg >= row.novice) return "novice";
  return "untrained";
}

const TIER_LABEL: Record<Tier, string> = {
  untrained: "Untrained",
  novice: "Novice",
  intermediate: "Intermediate",
  advanced: "Advanced",
  elite: "Elite",
};

export function tierLabel(t: Tier | null): string {
  return t ? TIER_LABEL[t] : "—";
}

const TIER_COLOR: Record<Tier, string> = {
  untrained: "bg-muted text-muted-foreground",
  novice: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  intermediate: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  advanced: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  elite: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

export function tierColor(t: Tier | null): string {
  return t ? TIER_COLOR[t] : TIER_COLOR.untrained;
}

/** Snap bodyweight to the closest seeded band for the lookup. */
export function bodyweightBand(weightKg: number, sex: Sex): string {
  if (sex === "female") return "60";
  return "80";
}
