import { redirect } from "next/navigation";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { getRecentTazzleMeals } from "@/lib/queries/nutrition";
import { lookupDisplayNames } from "@/lib/queries/sessions";
import { macrosForQuantity, sumMacros } from "@/lib/nutrition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RealtimeRefresher } from "@/components/realtime-refresher";

export default async function NutritionHistoryPage() {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");
  const meals = await getRecentTazzleMeals(tazzleId, 50);
  const userIds = Array.from(new Set(meals.map((m) => m.user_id as string)));
  const names = await lookupDisplayNames(userIds);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <RealtimeRefresher tazzleId={tazzleId} channels={["meals"]} />
      <h1 className="text-2xl font-semibold">Tazzle nutrition feed</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent meals</CardTitle>
        </CardHeader>
        <CardContent>
          {meals.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nothing yet.</p>
          ) : (
            <ul className="divide-y">
              {meals.map((m) => {
                const items =
                  (m.nutrition_meal_items as unknown as Array<{
                    quantity_g: number;
                    nutrition_foods: {
                      name: string;
                      serving_size_g: number;
                      kcal: number;
                      protein_g: number;
                      carbs_g: number;
                      fat_g: number;
                    } | null;
                  }>) ?? [];
                const totals = sumMacros(
                  items
                    .filter((i) => i.nutrition_foods)
                    .map((i) =>
                      macrosForQuantity(
                        { ...i.nutrition_foods!, fiber_g: null },
                        i.quantity_g,
                      ),
                    ),
                );
                return (
                  <li key={m.id as string} className="py-2 text-sm">
                    <p className="font-medium">
                      {names.get(m.user_id as string) ?? "buddy"} ·{" "}
                      <span className="capitalize">{m.meal_type as string}</span>{" "}
                      <span className="text-muted-foreground">
                        · {new Date(m.eaten_at as string).toLocaleString()}
                      </span>
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {totals.kcal.toFixed(0)} kcal · P{totals.protein_g.toFixed(0)} · C
                      {totals.carbs_g.toFixed(0)} · F{totals.fat_g.toFixed(0)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
