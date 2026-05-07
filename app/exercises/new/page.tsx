import { redirect } from "next/navigation";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { createExerciseAction } from "@/lib/actions/exercises";
import { listEquipment, listMuscleGroups } from "@/lib/queries/exercises";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewExercisePage() {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");
  const [muscles, equipmentList] = await Promise.all([
    listMuscleGroups(),
    listEquipment(),
  ]);

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>New exercise</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createExerciseAction} className="space-y-4">
            <input type="hidden" name="chunky_tazzle_id" value={tazzleId} />
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required maxLength={120} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="primary_muscle_id">Primary muscle</Label>
                <select
                  id="primary_muscle_id"
                  name="primary_muscle_id"
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                >
                  <option value="">—</option>
                  {muscles.map((m) => (
                    <option key={m.id as string} value={m.id as string}>
                      {m.name as string}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="equipment_id">Equipment</Label>
                <select
                  id="equipment_id"
                  name="equipment_id"
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                >
                  <option value="">—</option>
                  {equipmentList.map((e) => (
                    <option key={e.id as string} value={e.id as string}>
                      {e.name as string}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" maxLength={2000} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instructions">Cues / instructions</Label>
              <Textarea id="instructions" name="instructions" rows={5} maxLength={4000} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="video_url">Video URL (optional)</Label>
              <Input id="video_url" name="video_url" type="url" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_unilateral" />
              Unilateral (one side at a time)
            </label>
            <Button type="submit" className="w-full">
              Create exercise
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
