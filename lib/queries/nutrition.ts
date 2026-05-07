import { createSupabaseServerClient } from "@/lib/supabase/server";
import { macrosForQuantity, sumMacros, ZERO, type MacroTotals } from "@/lib/nutrition";

function startEnd(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function getDayLog(date: Date = new Date()) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { start, end } = startEnd(date);

  const { data: meals } = await supabase
    .from("nutrition_meals")
    .select(
      "id, eaten_at, meal_type, notes, photo_url, nutrition_meal_items(id,food_id,quantity_g,position,nutrition_foods(id,name,brand,serving_size_g,kcal,protein_g,carbs_g,fat_g,fiber_g))",
    )
    .eq("user_id", user.id)
    .gte("eaten_at", start)
    .lt("eaten_at", end)
    .order("eaten_at", { ascending: true });

  const { data: water } = await supabase
    .from("water_logs")
    .select("id, amount_ml, logged_at")
    .eq("user_id", user.id)
    .gte("logged_at", start)
    .lt("logged_at", end);

  const totals: MacroTotals = sumMacros(
    (meals ?? []).flatMap((m) => {
      const items =
        (m.nutrition_meal_items as unknown as Array<{
          quantity_g: number;
          nutrition_foods: {
            serving_size_g: number;
            kcal: number;
            protein_g: number;
            carbs_g: number;
            fat_g: number;
            fiber_g: number | null;
          } | null;
        }>) ?? [];
      return items
        .filter((i) => i.nutrition_foods)
        .map((i) => macrosForQuantity(i.nutrition_foods!, i.quantity_g));
    }),
  );

  const waterMl = (water ?? []).reduce((sum, w) => sum + (w.amount_ml as number), 0);

  return { meals: meals ?? [], water: water ?? [], totals: totals ?? ZERO, waterMl };
}

export async function getTargets() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("nutrition_targets")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return data;
}

export async function listFoods(opts: { tazzleId: string; search?: string }) {
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("nutrition_foods")
    .select(
      "id, name, brand, serving_size_g, serving_label, kcal, protein_g, carbs_g, fat_g, fiber_g, barcode, chunky_tazzle_id",
    )
    .or(`chunky_tazzle_id.is.null,chunky_tazzle_id.eq.${opts.tazzleId}`)
    .order("name")
    .limit(200);
  if (opts.search?.trim()) q = q.ilike("name", `%${opts.search.trim()}%`);
  const { data } = await q;
  return data ?? [];
}

export async function getFood(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("nutrition_foods")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function listRecipes(tazzleId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("nutrition_recipes")
    .select("id, name, description, servings_yield, photo_url, updated_at")
    .eq("chunky_tazzle_id", tazzleId)
    .order("updated_at", { ascending: false });
  return data ?? [];
}

export async function getRecipe(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: recipe } = await supabase
    .from("nutrition_recipes")
    .select("*")
    .eq("id", id)
    .single();
  if (!recipe) return null;
  const { data: items } = await supabase
    .from("nutrition_recipe_items")
    .select(
      "id, food_id, quantity_g, position, nutrition_foods(id,name,brand,serving_size_g,kcal,protein_g,carbs_g,fat_g,fiber_g)",
    )
    .eq("recipe_id", id)
    .order("position");
  return { recipe, items: items ?? [] };
}

export async function getRecentTazzleMeals(tazzleId: string, limit = 30) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("nutrition_meals")
    .select(
      "id, user_id, eaten_at, meal_type, notes, nutrition_meal_items(quantity_g,nutrition_foods(name,kcal,serving_size_g,protein_g,carbs_g,fat_g))",
    )
    .eq("chunky_tazzle_id", tazzleId)
    .order("eaten_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getWeeklyAverages(days = 7) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const { data: meals } = await supabase
    .from("nutrition_meals")
    .select(
      "eaten_at, nutrition_meal_items(quantity_g,nutrition_foods(serving_size_g,kcal,protein_g,carbs_g,fat_g,fiber_g))",
    )
    .eq("user_id", user.id)
    .gte("eaten_at", start.toISOString());

  const dailyTotals = new Map<
    string,
    { kcal: number; protein: number; carbs: number; fat: number; fiber: number }
  >();
  for (const m of meals ?? []) {
    const day = new Date(m.eaten_at as string).toISOString().slice(0, 10);
    const cur = dailyTotals.get(day) ?? {
      kcal: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    };
    const items = (m.nutrition_meal_items as unknown as Array<{
      quantity_g: number;
      nutrition_foods: {
        serving_size_g: number;
        kcal: number;
        protein_g: number;
        carbs_g: number;
        fat_g: number;
        fiber_g: number | null;
      } | null;
    }>) ?? [];
    for (const it of items) {
      const f = it.nutrition_foods;
      if (!f || !f.serving_size_g || f.serving_size_g <= 0) continue;
      const r = it.quantity_g / f.serving_size_g;
      cur.kcal += f.kcal * r;
      cur.protein += f.protein_g * r;
      cur.carbs += f.carbs_g * r;
      cur.fat += f.fat_g * r;
      cur.fiber += (f.fiber_g ?? 0) * r;
    }
    dailyTotals.set(day, cur);
  }

  const series = [...dailyTotals.entries()]
    .map(([day, t]) => ({ day, ...t }))
    .sort((a, b) => a.day.localeCompare(b.day));
  const n = series.length || 1;
  const sum = series.reduce(
    (a, c) => ({
      kcal: a.kcal + c.kcal,
      protein: a.protein + c.protein,
      carbs: a.carbs + c.carbs,
      fat: a.fat + c.fat,
      fiber: a.fiber + c.fiber,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );
  return {
    series,
    averages: {
      kcal: sum.kcal / n,
      protein: sum.protein / n,
      carbs: sum.carbs / n,
      fat: sum.fat / n,
      fiber: sum.fiber / n,
    },
    days: series.length,
  };
}
