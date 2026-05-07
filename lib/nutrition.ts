export interface FoodMacros {
  serving_size_g: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
}

export interface MacroTotals {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export const ZERO: MacroTotals = {
  kcal: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  fiber_g: 0,
};

export function macrosForQuantity(food: FoodMacros, quantityG: number): MacroTotals {
  const ratio = food.serving_size_g > 0 ? quantityG / food.serving_size_g : 0;
  return {
    kcal: food.kcal * ratio,
    protein_g: food.protein_g * ratio,
    carbs_g: food.carbs_g * ratio,
    fat_g: food.fat_g * ratio,
    fiber_g: (food.fiber_g ?? 0) * ratio,
  };
}

export function sumMacros(rows: MacroTotals[]): MacroTotals {
  return rows.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein_g: acc.protein_g + m.protein_g,
      carbs_g: acc.carbs_g + m.carbs_g,
      fat_g: acc.fat_g + m.fat_g,
      fiber_g: acc.fiber_g + m.fiber_g,
    }),
    ZERO,
  );
}

export interface Targets {
  kcal_target: number;
  protein_g_target: number;
  carbs_g_target: number;
  fat_g_target: number;
  fiber_g_target: number;
}

export function deficitVsTargets(totals: MacroTotals, targets: Targets) {
  return {
    kcal: targets.kcal_target - totals.kcal,
    protein_g: targets.protein_g_target - totals.protein_g,
    carbs_g: targets.carbs_g_target - totals.carbs_g,
    fat_g: targets.fat_g_target - totals.fat_g,
    fiber_g: targets.fiber_g_target - totals.fiber_g,
  };
}

export function recipePerServing(items: MacroTotals[], servings: number): MacroTotals {
  const total = sumMacros(items);
  const denom = servings > 0 ? servings : 1;
  return {
    kcal: total.kcal / denom,
    protein_g: total.protein_g / denom,
    carbs_g: total.carbs_g / denom,
    fat_g: total.fat_g / denom,
    fiber_g: total.fiber_g / denom,
  };
}
