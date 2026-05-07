export interface StallEvaluation {
  isStalled: boolean;
  trend: "up" | "flat" | "down";
  recentE1RM: number[];
  windowSessions: number;
}

/**
 * Given the last N e1RM values for an exercise (newest last), decide if the
 * lifter is stalled. We treat it as stalled when:
 *   - 4+ values exist, AND
 *   - the best in the last 4 isn't higher than the best in the prior 4 by ≥ 1 kg
 */
export function evaluateStall(
  recent: number[],
  windowSize = 4,
): StallEvaluation {
  const filtered = recent.filter((n) => Number.isFinite(n) && n > 0);
  if (filtered.length < windowSize * 2) {
    return {
      isStalled: false,
      trend: filtered.length >= 2 && filtered.at(-1)! > filtered[0] ? "up" : "flat",
      recentE1RM: filtered,
      windowSessions: filtered.length,
    };
  }
  const tail = filtered.slice(-windowSize);
  const head = filtered.slice(-windowSize * 2, -windowSize);
  const bestTail = Math.max(...tail);
  const bestHead = Math.max(...head);
  const delta = bestTail - bestHead;
  if (delta <= 0.5)
    return {
      isStalled: true,
      trend: delta < -0.5 ? "down" : "flat",
      recentE1RM: filtered,
      windowSessions: filtered.length,
    };
  return {
    isStalled: false,
    trend: "up",
    recentE1RM: filtered,
    windowSessions: filtered.length,
  };
}
