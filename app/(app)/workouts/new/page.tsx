import { redirect } from "next/navigation";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { listExercises } from "@/lib/queries/exercises";
import { TemplateBuilder } from "@/components/workouts/TemplateBuilder";

export default async function NewTemplatePage() {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");

  const exercises = await listExercises({ tazzleId });
  const opts = exercises.map((e) => ({ id: e.id as string, name: e.name as string }));

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <TemplateBuilder mode="create" tazzleId={tazzleId} exercises={opts} />
    </div>
  );
}
