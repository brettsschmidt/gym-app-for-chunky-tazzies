import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { listRecipes } from "@/lib/queries/nutrition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function RecipesPage() {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");
  const recipes = await listRecipes(tazzleId);
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Recipes</h1>
        <Button asChild>
          <Link href="/nutrition/recipes/new">
            <Plus className="size-4" /> New
          </Link>
        </Button>
      </header>
      {recipes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No recipes yet.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {recipes.map((r) => (
            <li key={r.id as string}>
              <Link href={`/nutrition/recipes/${r.id}`}>
                <Card className="hover:border-primary transition-colors">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{r.name as string}</p>
                      <p className="text-muted-foreground text-xs">
                        {Number(r.servings_yield)} servings
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
