import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Settings2, Trash2 } from "lucide-react";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { getDayLog, getTargets } from "@/lib/queries/nutrition";
import { deficitVsTargets, type Targets } from "@/lib/nutrition";
import { deleteMealAction } from "@/lib/actions/nutrition";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MacroRing } from "@/components/nutrition/MacroRing";
import { WaterTracker } from "@/components/nutrition/WaterTracker";
import { RealtimeRefresher } from "@/components/realtime-refresher";

const DEFAULT_TARGETS: Targets = {
  kcal_target: 2400,
  protein_g_target: 160,
  carbs_g_target: 280,
  fat_g_target: 70,
  fiber_g_target: 30,
};

export default async function NutritionPage() {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");

  const [day, targetsRow] = await Promise.all([getDayLog(), getTargets()]);
  if (!day) redirect("/login");
  const targets: Targets = targetsRow
    ? {
        kcal_target: targetsRow.kcal_target as number,
        protein_g_target: targetsRow.protein_g_target as number,
        carbs_g_target: targetsRow.carbs_g_target as number,
        fat_g_target: targetsRow.fat_g_target as number,
        fiber_g_target: targetsRow.fiber_g_target as number,
      }
    : DEFAULT_TARGETS;

  const deficit = deficitVsTargets(day.totals, targets);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <RealtimeRefresher tazzleId={tazzleId} channels={["meals"]} />
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Today</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/nutrition/targets">
              <Settings2 className="size-4" /> Targets
            </Link>
          </Button>
          <Button asChild>
            <Link href="/nutrition/log">
              <Plus className="size-4" /> Log meal
            </Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Macros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <MacroRing
              label="Calories"
              value={day.totals.kcal}
              target={targets.kcal_target}
              unit="kcal"
            />
            <MacroRing
              label="Protein"
              value={day.totals.protein_g}
              target={targets.protein_g_target}
              colorClass="text-success"
            />
            <MacroRing
              label="Carbs"
              value={day.totals.carbs_g}
              target={targets.carbs_g_target}
              colorClass="text-warning"
            />
            <MacroRing
              label="Fat"
              value={day.totals.fat_g}
              target={targets.fat_g_target}
              colorClass="text-accent"
            />
            <MacroRing
              label="Fiber"
              value={day.totals.fiber_g}
              target={targets.fiber_g_target}
            />
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            {deficit.kcal >= 0
              ? `${Math.round(deficit.kcal)} kcal left`
              : `${Math.round(-deficit.kcal)} kcal over`}
          </p>
        </CardContent>
      </Card>

      <WaterTracker totalMl={day.waterMl} />

      <Card>
        <CardHeader>
          <CardTitle>Meals</CardTitle>
        </CardHeader>
        <CardContent>
          {day.meals.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nothing logged today. <Link className="text-primary hover:underline" href="/nutrition/log">Log a meal →</Link>
            </p>
          ) : (
            <ul className="divide-y">
              {day.meals.map((m) => {
                const items =
                  (m.nutrition_meal_items as unknown as Array<{
                    quantity_g: number;
                    nutrition_foods: { name: string } | null;
                  }>) ?? [];
                return (
                  <li key={m.id as string} className="flex items-start justify-between gap-2 py-2">
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {m.meal_type as string}{" "}
                        <span className="text-muted-foreground">
                          · {new Date(m.eaten_at as string).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {items
                          .map(
                            (i) =>
                              `${i.nutrition_foods?.name ?? "?"} (${Math.round(i.quantity_g)} g)`,
                          )
                          .join(" · ")}
                      </p>
                      {m.notes && <p className="text-xs">{m.notes as string}</p>}
                    </div>
                    <form action={deleteMealAction}>
                      <input type="hidden" name="id" value={m.id as string} />
                      <Button type="submit" variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="size-4" />
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/nutrition/foods">Foods</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/nutrition/recipes">Recipes</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/nutrition/history">History</Link>
        </Button>
      </div>
    </div>
  );
}
