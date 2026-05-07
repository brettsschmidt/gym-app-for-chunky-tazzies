import { notFound } from "next/navigation";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { getRecipe } from "@/lib/queries/nutrition";
import {
  deleteRecipeAction,
  logRecipeAsMealAction,
} from "@/lib/actions/nutrition";
import {
  macrosForQuantity,
  recipePerServing,
  sumMacros,
} from "@/lib/nutrition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");

  const result = await getRecipe(id);
  if (!result) notFound();
  const { recipe, items } = result;

  const itemMacros = items
    .map((i) => {
      const f = i.nutrition_foods as unknown as
        | {
            serving_size_g: number;
            kcal: number;
            protein_g: number;
            carbs_g: number;
            fat_g: number;
            fiber_g: number | null;
          }
        | null;
      return f ? macrosForQuantity(f, i.quantity_g as number) : null;
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  const total = sumMacros(itemMacros);
  const perServing = recipePerServing(itemMacros, recipe.servings_yield as number);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{recipe.name as string}</h1>
          <p className="text-muted-foreground text-sm">
            {Number(recipe.servings_yield)} servings
          </p>
        </div>
        <div className="flex gap-2">
          <form action={logRecipeAsMealAction}>
            <input type="hidden" name="recipe_id" value={id} />
            <input type="hidden" name="chunky_tazzle_id" value={tazzleId} />
            <Button type="submit">Log as meal</Button>
          </form>
          <form action={deleteRecipeAction}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="ghost" className="text-destructive">
              Delete
            </Button>
          </form>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {items.map((i) => {
              const f = i.nutrition_foods as unknown as { name: string } | null;
              return (
                <li key={i.id as string} className="flex justify-between py-2">
                  <span>{f?.name ?? "?"}</span>
                  <span className="text-muted-foreground">{Number(i.quantity_g)} g</span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Macros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <Stat label="Total kcal" value={total.kcal.toFixed(0)} />
          <Stat label="Per serving kcal" value={perServing.kcal.toFixed(0)} />
          <Stat label="Total protein" value={`${total.protein_g.toFixed(0)} g`} />
          <Stat label="Per serving protein" value={`${perServing.protein_g.toFixed(0)} g`} />
          <Stat label="Total carbs" value={`${total.carbs_g.toFixed(0)} g`} />
          <Stat label="Per serving carbs" value={`${perServing.carbs_g.toFixed(0)} g`} />
          <Stat label="Total fat" value={`${total.fat_g.toFixed(0)} g`} />
          <Stat label="Per serving fat" value={`${perServing.fat_g.toFixed(0)} g`} />
        </CardContent>
      </Card>

      <Button asChild variant="outline" size="sm">
        <Link href="/nutrition/recipes">← Recipes</Link>
      </Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted rounded-md p-2">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
