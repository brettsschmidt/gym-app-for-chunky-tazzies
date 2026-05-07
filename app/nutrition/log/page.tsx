import { redirect } from "next/navigation";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { listFoods } from "@/lib/queries/nutrition";
import {
  MealEditor,
  type FoodOption,
} from "@/components/nutrition/MealEditor";

export default async function LogMealPage() {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");
  const foods = await listFoods({ tazzleId });
  const opts: FoodOption[] = foods.map((f) => ({
    id: f.id as string,
    name: f.name as string,
    brand: (f.brand as string | null) ?? null,
    serving_size_g: Number(f.serving_size_g) || 100,
    serving_label: (f.serving_label as string | null) ?? null,
    kcal: Number(f.kcal) || 0,
    protein_g: Number(f.protein_g) || 0,
    carbs_g: Number(f.carbs_g) || 0,
    fat_g: Number(f.fat_g) || 0,
    fiber_g: f.fiber_g != null ? Number(f.fiber_g) : null,
  }));
  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <MealEditor tazzleId={tazzleId} foods={opts} />
    </div>
  );
}
