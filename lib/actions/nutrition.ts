"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  foodSchema,
  logMealSchema,
  logRecipeAsMealSchema,
  mealItemSchema,
  recipeSchema,
  targetsSchema,
  waterLogSchema,
} from "@/lib/schemas/nutrition";

function parsePayload(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function createFoodAction(formData: FormData) {
  const parsed = foodSchema.safeParse({
    chunky_tazzle_id: formData.get("chunky_tazzle_id"),
    name: formData.get("name"),
    brand: formData.get("brand") || undefined,
    serving_size_g: formData.get("serving_size_g") ?? 100,
    serving_label: formData.get("serving_label") || undefined,
    kcal: formData.get("kcal") ?? 0,
    protein_g: formData.get("protein_g") ?? 0,
    carbs_g: formData.get("carbs_g") ?? 0,
    fat_g: formData.get("fat_g") ?? 0,
    fiber_g: formData.get("fiber_g") || undefined,
    sugar_g: formData.get("sugar_g") || undefined,
    sodium_mg: formData.get("sodium_mg") || undefined,
    barcode: formData.get("barcode") || undefined,
  });
  if (!parsed.success) redirect("/nutrition/foods/new?error=invalid_input");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("nutrition_foods")
    .insert({
      ...parsed.data,
      brand: parsed.data.brand ?? null,
      serving_label: parsed.data.serving_label ?? null,
      fiber_g: parsed.data.fiber_g ?? null,
      sugar_g: parsed.data.sugar_g ?? null,
      sodium_mg: parsed.data.sodium_mg ?? null,
      barcode: parsed.data.barcode ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) redirect("/nutrition/foods/new?error=create_failed");

  revalidatePath("/nutrition/foods");
  redirect(`/nutrition/foods/${data.id}`);
}

export async function setTargetsAction(formData: FormData) {
  const parsed = targetsSchema.safeParse({
    kcal_target: formData.get("kcal_target"),
    protein_g_target: formData.get("protein_g_target"),
    carbs_g_target: formData.get("carbs_g_target"),
    fat_g_target: formData.get("fat_g_target"),
    fiber_g_target: formData.get("fiber_g_target") ?? 30,
  });
  if (!parsed.success) redirect("/nutrition/targets?error=invalid_input");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("nutrition_targets").upsert({
    user_id: user.id,
    ...parsed.data,
  });
  revalidatePath("/nutrition");
  revalidatePath("/nutrition/targets");
  redirect("/nutrition");
}

export async function logMealAction(formData: FormData) {
  const payload = parsePayload(formData.get("payload"));
  const parsed = logMealSchema.safeParse(payload);
  if (!parsed.success) redirect("/nutrition/log?error=invalid_input");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: meal, error } = await supabase
    .from("nutrition_meals")
    .insert({
      user_id: user.id,
      chunky_tazzle_id: parsed.data.chunky_tazzle_id,
      eaten_at: parsed.data.eaten_at
        ? new Date(parsed.data.eaten_at).toISOString()
        : new Date().toISOString(),
      meal_type: parsed.data.meal_type,
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single();
  if (error || !meal) redirect("/nutrition/log?error=create_failed");

  if (parsed.data.items.length) {
    await supabase.from("nutrition_meal_items").insert(
      parsed.data.items.map((it, idx) => ({
        meal_id: meal.id as string,
        food_id: it.food_id,
        quantity_g: it.quantity_g,
        position: idx,
      })),
    );
  }
  revalidatePath("/nutrition");
  redirect("/nutrition");
}

export async function addMealItemAction(formData: FormData) {
  const parsed = mealItemSchema.safeParse({
    meal_id: formData.get("meal_id"),
    food_id: formData.get("food_id"),
    quantity_g: formData.get("quantity_g"),
  });
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("nutrition_meal_items").insert({
    meal_id: parsed.data.meal_id,
    food_id: parsed.data.food_id,
    quantity_g: parsed.data.quantity_g,
  });
  revalidatePath("/nutrition");
}

export async function deleteMealAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("nutrition_meals").delete().eq("id", id);
  revalidatePath("/nutrition");
}

export async function logWaterAction(formData: FormData) {
  const parsed = waterLogSchema.safeParse({
    amount_ml: formData.get("amount_ml"),
  });
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("water_logs").insert({
    user_id: user.id,
    amount_ml: parsed.data.amount_ml,
  });
  revalidatePath("/nutrition");
}

export async function createRecipeAction(formData: FormData) {
  const payload = parsePayload(formData.get("payload"));
  const parsed = recipeSchema.safeParse(payload);
  if (!parsed.success) redirect("/nutrition/recipes/new?error=invalid_input");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: recipe, error } = await supabase
    .from("nutrition_recipes")
    .insert({
      chunky_tazzle_id: parsed.data.chunky_tazzle_id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      servings_yield: parsed.data.servings_yield,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !recipe) redirect("/nutrition/recipes/new?error=create_failed");

  if (parsed.data.items.length) {
    await supabase.from("nutrition_recipe_items").insert(
      parsed.data.items.map((it, idx) => ({
        recipe_id: recipe.id as string,
        food_id: it.food_id,
        quantity_g: it.quantity_g,
        position: idx,
      })),
    );
  }
  revalidatePath("/nutrition/recipes");
  redirect(`/nutrition/recipes/${recipe.id}`);
}

export async function deleteRecipeAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("nutrition_recipes").delete().eq("id", id);
  revalidatePath("/nutrition/recipes");
  redirect("/nutrition/recipes");
}

export async function logRecipeAsMealAction(formData: FormData) {
  const parsed = logRecipeAsMealSchema.safeParse({
    recipe_id: formData.get("recipe_id"),
    chunky_tazzle_id: formData.get("chunky_tazzle_id"),
    meal_type: formData.get("meal_type") ?? "snack",
  });
  if (!parsed.success) redirect("/nutrition?error=invalid_input");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: meal, error } = await supabase
    .from("nutrition_meals")
    .insert({
      user_id: user.id,
      chunky_tazzle_id: parsed.data.chunky_tazzle_id,
      meal_type: parsed.data.meal_type,
    })
    .select("id")
    .single();
  if (error || !meal) redirect("/nutrition?error=create_failed");

  await supabase.rpc("expand_recipe_into_meal", {
    recipe: parsed.data.recipe_id,
    meal: meal.id as string,
  });
  revalidatePath("/nutrition");
  redirect("/nutrition");
}
