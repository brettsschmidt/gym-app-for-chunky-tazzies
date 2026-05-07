import { z } from "zod";

export const foodSchema = z.object({
  chunky_tazzle_id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  brand: z.string().trim().max(80).optional(),
  serving_size_g: z.coerce.number().positive().default(100),
  serving_label: z.string().trim().max(40).optional(),
  kcal: z.coerce.number().min(0).default(0),
  protein_g: z.coerce.number().min(0).default(0),
  carbs_g: z.coerce.number().min(0).default(0),
  fat_g: z.coerce.number().min(0).default(0),
  fiber_g: z.coerce.number().min(0).optional(),
  sugar_g: z.coerce.number().min(0).optional(),
  sodium_mg: z.coerce.number().min(0).optional(),
  barcode: z.string().trim().max(40).optional(),
});

export const targetsSchema = z.object({
  kcal_target: z.coerce.number().int().min(800).max(7000),
  protein_g_target: z.coerce.number().int().min(20).max(500),
  carbs_g_target: z.coerce.number().int().min(0).max(1200),
  fat_g_target: z.coerce.number().int().min(10).max(500),
  fiber_g_target: z.coerce.number().int().min(0).max(120).default(30),
});

export const logMealSchema = z.object({
  chunky_tazzle_id: z.string().uuid(),
  eaten_at: z.string().optional(),
  meal_type: z
    .enum(["breakfast", "lunch", "dinner", "snack", "preworkout", "postworkout"])
    .default("snack"),
  notes: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        food_id: z.string().uuid(),
        quantity_g: z.coerce.number().positive(),
      }),
    )
    .default([]),
});

export const mealItemSchema = z.object({
  meal_id: z.string().uuid(),
  food_id: z.string().uuid(),
  quantity_g: z.coerce.number().positive(),
});

export const waterLogSchema = z.object({
  amount_ml: z.coerce.number().int().positive().max(5000),
});

export const recipeSchema = z.object({
  chunky_tazzle_id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  servings_yield: z.coerce.number().positive().default(1),
  items: z
    .array(
      z.object({
        food_id: z.string().uuid(),
        quantity_g: z.coerce.number().positive(),
      }),
    )
    .default([]),
});

export const logRecipeAsMealSchema = z.object({
  recipe_id: z.string().uuid(),
  chunky_tazzle_id: z.string().uuid(),
  meal_type: z
    .enum(["breakfast", "lunch", "dinner", "snack", "preworkout", "postworkout"])
    .default("snack"),
});
