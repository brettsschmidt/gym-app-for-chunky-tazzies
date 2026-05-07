import { notFound } from "next/navigation";
import Link from "next/link";
import { getExercise } from "@/lib/queries/exercises";
import { deleteExerciseAction } from "@/lib/actions/exercises";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exercise = await getExercise(id);
  if (!exercise) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const canDelete = !!exercise.chunky_tazzle_id && user;

  const mg = exercise.muscle_groups as unknown as { name: string } | null;
  const eq = exercise.equipment as unknown as { name: string } | null;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {exercise.name as string}
            {exercise.chunky_tazzle_id ? (
              <Badge variant="accent">custom</Badge>
            ) : (
              <Badge variant="outline">global</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {mg?.name ?? "—"} · {eq?.name ?? "—"}
            {exercise.is_unilateral ? " · unilateral" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exercise.description && <p className="text-sm">{exercise.description as string}</p>}
          {exercise.instructions && (
            <div>
              <h2 className="mb-1 text-sm font-semibold">Cues</h2>
              <p className="text-muted-foreground whitespace-pre-line text-sm">
                {exercise.instructions as string}
              </p>
            </div>
          )}
          {exercise.video_url && (
            <a
              href={exercise.video_url as string}
              target="_blank"
              rel="noreferrer"
              className="text-primary text-sm hover:underline"
            >
              ▶︎ Demo video
            </a>
          )}
          <div className="flex gap-2 pt-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/exercises">Back to catalog</Link>
            </Button>
            {canDelete && (
              <form action={deleteExerciseAction}>
                <input type="hidden" name="id" value={id} />
                <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                  Delete
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
