import Link from "next/link";
import { getTargets } from "@/lib/queries/nutrition";
import { setTargetsAction } from "@/lib/actions/nutrition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TargetsPage() {
  const t = await getTargets();
  return (
    <div className="mx-auto max-w-md space-y-4 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Daily macro targets</span>
            <Button asChild variant="outline" size="sm">
              <Link href="/nutrition/targets/calculator">Calculator</Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={setTargetsAction} className="space-y-3">
            <NumField id="kcal_target" label="Calories (kcal)" defaultValue={(t?.kcal_target as number) ?? 2400} />
            <NumField id="protein_g_target" label="Protein (g)" defaultValue={(t?.protein_g_target as number) ?? 160} />
            <NumField id="carbs_g_target" label="Carbs (g)" defaultValue={(t?.carbs_g_target as number) ?? 280} />
            <NumField id="fat_g_target" label="Fat (g)" defaultValue={(t?.fat_g_target as number) ?? 70} />
            <NumField id="fiber_g_target" label="Fiber (g)" defaultValue={(t?.fiber_g_target as number) ?? 30} />
            <Button type="submit" className="w-full">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function NumField({
  id,
  label,
  defaultValue,
}: {
  id: string;
  label: string;
  defaultValue: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type="number" min={0} defaultValue={defaultValue} />
    </div>
  );
}
