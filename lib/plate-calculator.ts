export interface PlateConfig {
  /** Bar weight in kg (Olympic 20, women's 15, technique 7.5, etc.) */
  barWeightKg: number;
  /** Available plate denominations per side, descending. */
  availablePlatesKg: number[];
}

export const STANDARD_PLATES: PlateConfig = {
  barWeightKg: 20,
  availablePlatesKg: [25, 20, 15, 10, 5, 2.5, 1.25, 0.5],
};

export interface PlateBreakdown {
  perSide: Array<{ plateKg: number; count: number }>;
  totalKg: number;
  remainder: number;
}

/**
 * Greedy per-side breakdown. If the bar is heavier than the target, returns
 * an empty stack. Tracks an integer "remainder" so the UI can flag impossible
 * loads (e.g. 21.3 kg on a 20 kg bar with no 0.5 plates).
 */
export function platesPerSide(
  targetKg: number,
  config: PlateConfig = STANDARD_PLATES,
): PlateBreakdown {
  const perSideTarget = (targetKg - config.barWeightKg) / 2;
  if (perSideTarget <= 0) {
    return { perSide: [], totalKg: config.barWeightKg, remainder: 0 };
  }
  let remaining = perSideTarget;
  const stack: PlateBreakdown["perSide"] = [];
  for (const plate of config.availablePlatesKg) {
    if (remaining <= 0) break;
    const count = Math.floor(remaining / plate + 1e-6);
    if (count > 0) {
      stack.push({ plateKg: plate, count });
      remaining -= count * plate;
    }
  }
  const total =
    config.barWeightKg +
    stack.reduce((s, p) => s + p.plateKg * p.count * 2, 0);
  return {
    perSide: stack,
    totalKg: total,
    remainder: Math.max(0, remaining * 2),
  };
}
