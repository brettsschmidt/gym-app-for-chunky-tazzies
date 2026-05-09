import { notFound } from "next/navigation";
import Link from "next/link";
import { getFood } from "@/lib/queries/nutrition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function FoodDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const food = await getFood(id);
  if (!food) notFound();
  return (
    <div className="mx-auto max-w-xl space-y-4 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {food.name as string}
            {food.brand && (
              <span className="text-muted-foreground"> · {food.brand as string}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[8rem_1fr] gap-2 text-sm">
            <dt className="text-muted-foreground">Serving</dt>
            <dd>
              {Number(food.serving_size_g)} g
              {food.serving_label && ` (${food.serving_label as string})`}
            </dd>
            <dt className="text-muted-foreground">Calories</dt>
            <dd>{Number(food.kcal).toFixed(0)} kcal</dd>
            <dt className="text-muted-foreground">Protein</dt>
            <dd>{Number(food.protein_g).toFixed(1)} g</dd>
            <dt className="text-muted-foreground">Carbs</dt>
            <dd>{Number(food.carbs_g).toFixed(1)} g</dd>
            <dt className="text-muted-foreground">Fat</dt>
            <dd>{Number(food.fat_g).toFixed(1)} g</dd>
            {food.fiber_g != null && (
              <>
                <dt className="text-muted-foreground">Fiber</dt>
                <dd>{Number(food.fiber_g).toFixed(1)} g</dd>
              </>
            )}
            {food.barcode && (
              <>
                <dt className="text-muted-foreground">Barcode</dt>
                <dd className="font-mono">{food.barcode as string}</dd>
              </>
            )}
          </dl>
          <div className="mt-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/nutrition/foods">← Back to foods</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
