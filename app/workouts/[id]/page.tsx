import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { getTemplate } from "@/lib/queries/workouts";
import { listExercises } from "@/lib/queries/exercises";
import { TemplateBuilder } from "@/components/workouts/TemplateBuilder";
import { Button } from "@/components/ui/button";
import { deleteTemplateAction } from "@/lib/actions/workouts";
import { copyLastSessionAction } from "@/lib/actions/sessions";
import type { TemplateExerciseLine } from "@/lib/schemas/workouts";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");

  const result = await getTemplate(id);
  if (!result) notFound();
  const { template, lines } = result;

  const exercises = await listExercises({ tazzleId });
  const opts = exercises.map((e) => ({ id: e.id as string, name: e.name as string }));

  const initialLines: TemplateExerciseLine[] = lines.map((l, idx) => ({
    exercise_id: l.exercise_id as string,
    position: (l.position as number) ?? idx,
    target_sets: (l.target_sets as number | null) ?? undefined,
    target_reps_min: (l.target_reps_min as number | null) ?? undefined,
    target_reps_max: (l.target_reps_max as number | null) ?? undefined,
    target_weight_kg: (l.target_weight_kg as number | null) ?? undefined,
    target_rpe: (l.target_rpe as number | null) ?? undefined,
    rest_seconds: (l.rest_seconds as number | null) ?? undefined,
    superset_group: (l.superset_group as number | null) ?? undefined,
    progression_rule: (l.progression_rule as TemplateExerciseLine["progression_rule"]) ?? {
      kind: "none",
    },
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href="/workouts">← Templates</Link>
        </Button>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/sessions/new?template=${id}`}>Start session</Link>
          </Button>
          <form action={copyLastSessionAction}>
            <input type="hidden" name="workout_template_id" value={id} />
            <input type="hidden" name="chunky_tazzle_id" value={tazzleId} />
            <Button type="submit" variant="outline">
              Repeat last
            </Button>
          </form>
          <form action={deleteTemplateAction}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="ghost" className="text-destructive">
              Delete
            </Button>
          </form>
        </div>
      </div>
      <TemplateBuilder
        mode="edit"
        tazzleId={tazzleId}
        templateId={id}
        exercises={opts}
        initial={{
          name: template.name as string,
          notes: (template.notes as string) ?? "",
          lines: initialLines,
        }}
      />
    </div>
  );
}
