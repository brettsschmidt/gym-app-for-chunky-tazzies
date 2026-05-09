import { redirect } from "next/navigation";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { createFoodAction } from "@/lib/actions/nutrition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewFoodPage() {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");
  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>New food</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createFoodAction} className="space-y-3">
            <input type="hidden" name="chunky_tazzle_id" value={tazzleId} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="name" label="Name" required />
              <Field id="brand" label="Brand" />
              <Field id="serving_size_g" label="Serving size (g)" type="number" defaultValue="100" />
              <Field id="serving_label" label="Serving label" placeholder="e.g. 1 scoop" />
              <Field id="kcal" label="Calories" type="number" defaultValue="0" />
              <Field id="protein_g" label="Protein (g)" type="number" defaultValue="0" />
              <Field id="carbs_g" label="Carbs (g)" type="number" defaultValue="0" />
              <Field id="fat_g" label="Fat (g)" type="number" defaultValue="0" />
              <Field id="fiber_g" label="Fiber (g)" type="number" />
              <Field id="sugar_g" label="Sugar (g)" type="number" />
              <Field id="sodium_mg" label="Sodium (mg)" type="number" />
              <Field id="barcode" label="Barcode (optional)" />
            </div>
            <Button type="submit" className="w-full">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  id,
  label,
  type,
  required,
  defaultValue,
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type ?? "text"}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        step={type === "number" ? "any" : undefined}
      />
    </div>
  );
}
