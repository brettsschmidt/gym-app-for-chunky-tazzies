// Fun comparison stats for the tazzle's hot dog total.
// Numbers are intentionally a bit hand-wavy — this is for vibes, not science.

const HOTDOG_LENGTH_CM = 15; // ~6 inch standard wiener
const HOTDOG_WEIGHT_G = 75; // including bun, ballpark
const HOTDOG_KCAL = 290;
const HOTDOG_PROTEIN_G = 11;
const HOTDOG_SODIUM_MG = 760;

const EIFFEL_TOWER_M = 330;
const STATUE_OF_LIBERTY_M = 93;
const FOOTBALL_FIELD_M = 109.7;
const BIG_MAC_KCAL = 563;
const NATHANS_RECORD = 76; // Joey Chestnut's 2021 Nathan's record (single sitting)
const ELEPHANT_KG = 6000;
const BLUE_WHALE_TONGUE_KG = 2700;

export interface HotDogStat {
  label: string;
  value: string;
  detail: string;
  emoji: string;
}

export function buildHotDogStats(total: number, sessions: number): HotDogStat[] {
  const cm = total * HOTDOG_LENGTH_CM;
  const meters = cm / 100;
  const km = meters / 1000;
  const grams = total * HOTDOG_WEIGHT_G;
  const kg = grams / 1000;
  const kcal = total * HOTDOG_KCAL;
  const proteinG = total * HOTDOG_PROTEIN_G;
  const sodiumMg = total * HOTDOG_SODIUM_MG;

  const eiffelPct = (meters / EIFFEL_TOWER_M) * 100;
  const libertyPct = (meters / STATUE_OF_LIBERTY_M) * 100;
  const footballPct = (meters / FOOTBALL_FIELD_M) * 100;
  const bigMacs = kcal / BIG_MAC_KCAL;
  const chestnutTrips = total / NATHANS_RECORD;
  const elephantPct = (kg / ELEPHANT_KG) * 100;
  const whaleTonguePct = (kg / BLUE_WHALE_TONGUE_KG) * 100;

  function num(n: number, digits = 1): string {
    if (!Number.isFinite(n) || n === 0) return "0";
    if (n >= 100) return n.toFixed(0);
    if (n >= 10) return n.toFixed(1);
    return n.toFixed(digits);
  }

  function pct(n: number): string {
    if (n >= 100) return `${(n / 100).toFixed(2)}× over`;
    return `${num(n)}%`;
  }

  return [
    {
      label: "Stacked end-to-end",
      value: meters >= 1000 ? `${num(km, 2)} km` : `${num(meters)} m`,
      detail:
        meters < 50
          ? `that's ${num(meters * 3.281)} ft of pure tube`
          : `that's longer than ${num(meters / 25)} olympic pools`,
      emoji: "📏",
    },
    {
      label: "vs the Eiffel Tower",
      value: pct(eiffelPct),
      detail: `you'd need ${num(EIFFEL_TOWER_M / Math.max(meters, 0.001), 0)} more 🌭 to reach the top`,
      emoji: "🗼",
    },
    {
      label: "vs the Statue of Liberty",
      value: pct(libertyPct),
      detail: `${num(meters)} m of ${num(STATUE_OF_LIBERTY_M)} m`,
      emoji: "🗽",
    },
    {
      label: "vs a football field",
      value: pct(footballPct),
      detail: `end-zone glory is ${num(FOOTBALL_FIELD_M - meters)} m away`,
      emoji: "🏟️",
    },
    {
      label: "Total beef tonnage",
      value: kg >= 100 ? `${num(kg, 0)} kg` : `${num(kg)} kg`,
      detail:
        kg >= 1
          ? `${num((kg * 2.20462))} lbs of meat & bun`
          : `${num(grams)} g of meat & bun`,
      emoji: "⚖️",
    },
    {
      label: "vs an adult elephant",
      value: pct(elephantPct),
      detail: `the elephant weighs ${num(ELEPHANT_KG)} kg`,
      emoji: "🐘",
    },
    {
      label: "vs a blue whale's tongue",
      value: pct(whaleTonguePct),
      detail: `tongue: ${num(BLUE_WHALE_TONGUE_KG)} kg of pure muscle`,
      emoji: "🐋",
    },
    {
      label: "Calories destroyed",
      value: kcal >= 1000 ? `${num(kcal / 1000, 1)}k kcal` : `${num(kcal)} kcal`,
      detail: `≈ ${num(bigMacs)} Big Macs`,
      emoji: "🔥",
    },
    {
      label: "Protein consumed",
      value: proteinG >= 1000 ? `${num(proteinG / 1000, 2)} kg` : `${num(proteinG)} g`,
      detail: "all-beef gains",
      emoji: "💪",
    },
    {
      label: "Sodium intake",
      value: sodiumMg >= 1000 ? `${num(sodiumMg / 1000, 1)} g` : `${num(sodiumMg)} mg`,
      detail: `the WHO is concerned`,
      emoji: "🧂",
    },
    {
      label: "Joey Chestnut runs",
      value: chestnutTrips >= 1
        ? `${num(chestnutTrips, 2)}× full`
        : `${num(chestnutTrips * 100, 0)}% of one`,
      detail: `his record is ${NATHANS_RECORD} in 10 minutes`,
      emoji: "👑",
    },
    {
      label: "Avg per session",
      value: sessions > 0 ? num(total / sessions, 1) : "—",
      detail: `${sessions} eating event${sessions === 1 ? "" : "s"}`,
      emoji: "📊",
    },
  ];
}

export function flavorMessage(total: number): string {
  if (total === 0) return "the tazzle has not yet faced the dog. start now.";
  if (total < 5) return "a humble beginning. the iron remembers, but so does the bun.";
  if (total < 25) return "warming up the grill. respectable.";
  if (total < 100) return "now we're cooking. literally.";
  if (total < 250) return "the tazzle has officially become a problem.";
  if (total < 500) return "doctors don't have a chart for this.";
  if (total < 1000) return "you've consumed more hot dogs than most countries.";
  return "you have transcended hot dog. you ARE the dog.";
}
