export const KG_PER_LB = 0.45359237;

export type Units = "metric" | "imperial";

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function gToOz(g: number): number {
  return g / 28.3495;
}

export function ozToG(oz: number): number {
  return oz * 28.3495;
}

export function roundToIncrement(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

export function formatWeight(kg: number | null | undefined, units: Units): string {
  if (kg == null) return "—";
  if (units === "imperial") return `${kgToLb(kg).toFixed(1)} lb`;
  return `${kg.toFixed(1)} kg`;
}

export function formatGrams(g: number | null | undefined, units: Units): string {
  if (g == null) return "—";
  if (units === "imperial") return `${gToOz(g).toFixed(1)} oz`;
  if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`;
  return `${g.toFixed(0)} g`;
}

export function formatDistance(meters: number | null | undefined, units: Units): string {
  if (meters == null) return "—";
  if (units === "imperial") {
    const miles = meters / 1609.344;
    return `${miles.toFixed(2)} mi`;
  }
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${meters.toFixed(0)} m`;
}
