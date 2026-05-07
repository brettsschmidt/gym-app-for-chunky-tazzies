import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import {
  listExercises,
  listEquipment,
  listMuscleGroups,
} from "@/lib/queries/exercises";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; muscle?: string; equipment?: string }>;
}) {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");
  const { q, muscle, equipment } = await searchParams;

  const [exercises, muscles, equipmentList] = await Promise.all([
    listExercises({
      tazzleId,
      search: q,
      muscleSlug: muscle,
      equipmentSlug: equipment,
    }),
    listMuscleGroups(),
    listEquipment(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Exercises</h1>
        <Button asChild>
          <Link href="/exercises/new">
            <Plus className="size-4" /> New
          </Link>
        </Button>
      </header>

      <form className="grid gap-2 sm:grid-cols-[1fr_10rem_10rem]" method="get">
        <Input name="q" placeholder="Search…" defaultValue={q} />
        <select
          name="muscle"
          defaultValue={muscle ?? ""}
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
        >
          <option value="">All muscles</option>
          {muscles.map((m) => (
            <option key={m.id as string} value={m.slug as string}>
              {m.name as string}
            </option>
          ))}
        </select>
        <select
          name="equipment"
          defaultValue={equipment ?? ""}
          className="border-input bg-background h-9 rounded-md border px-2 text-sm"
        >
          <option value="">All equipment</option>
          {equipmentList.map((e) => (
            <option key={e.id as string} value={e.slug as string}>
              {e.name as string}
            </option>
          ))}
        </select>
      </form>

      <ul className="space-y-2">
        {exercises.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No exercises match.
            </CardContent>
          </Card>
        ) : (
          exercises.map((ex) => {
            const mg = ex.muscle_groups as unknown as { name: string } | null;
            const eq = ex.equipment as unknown as { name: string } | null;
            return (
              <li key={ex.id as string}>
                <Link href={`/exercises/${ex.id}`}>
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{ex.name as string}</p>
                        <p className="text-muted-foreground text-xs">
                          {mg?.name ?? "—"} · {eq?.name ?? "—"}
                        </p>
                      </div>
                      {ex.chunky_tazzle_id ? (
                        <Badge variant="accent">custom</Badge>
                      ) : (
                        <Badge variant="outline">global</Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
