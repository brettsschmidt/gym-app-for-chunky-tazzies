import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { listFoods } from "@/lib/queries/nutrition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function FoodsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");
  const { q } = await searchParams;
  const foods = await listFoods({ tazzleId, search: q });

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Foods</h1>
        <Button asChild>
          <Link href="/nutrition/foods/new">
            <Plus className="size-4" /> New
          </Link>
        </Button>
      </header>
      <form method="get">
        <Input name="q" defaultValue={q} placeholder="Search foods…" />
      </form>
      <ul className="space-y-2">
        {foods.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No foods match.
            </CardContent>
          </Card>
        ) : (
          foods.map((f) => (
            <li key={f.id as string}>
              <Link href={`/nutrition/foods/${f.id}`}>
                <Card className="hover:border-primary transition-colors">
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">
                        {f.name as string}
                        {f.brand && (
                          <span className="text-muted-foreground"> · {f.brand as string}</span>
                        )}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {Number(f.kcal).toFixed(0)} kcal / {Number(f.serving_size_g)} g · P
                        {Number(f.protein_g).toFixed(0)} · C{Number(f.carbs_g).toFixed(0)} · F
                        {Number(f.fat_g).toFixed(0)}
                      </p>
                    </div>
                    {f.chunky_tazzle_id ? (
                      <Badge variant="accent">custom</Badge>
                    ) : (
                      <Badge variant="outline">global</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
