import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSession, lookupDisplayNames } from "@/lib/queries/sessions";
import { listExercises } from "@/lib/queries/exercises";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { getUserUnits } from "@/lib/queries/units";
import { deleteSessionAction } from "@/lib/actions/sessions";
import { getComments, getReactions } from "@/lib/queries/social";
import {
  SessionLogger,
  type SessionExerciseShape,
} from "@/components/sessions/SessionLogger";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { Reactions } from "@/components/social/Reactions";
import { Comments } from "@/components/social/Comments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getSession(id);
  if (!result) notFound();
  const { session, exercises, setsByExercise } = result;

  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === (session.user_id as string);
  const isFinished = !!session.completed_at;

  const exerciseOptions = (await listExercises({ tazzleId })).map((e) => ({
    id: e.id as string,
    name: e.name as string,
  }));

  const shapedExercises: SessionExerciseShape[] = exercises.map((e) => ({
    id: e.id as string,
    exercise_id: e.exercise_id as string,
    exercise_name:
      (e.exercises as unknown as { name: string } | null)?.name ?? "Unknown exercise",
    position: e.position as number,
    sets: ((setsByExercise[e.id as string] ?? []) as Array<Record<string, unknown>>).map(
      (s) => ({
        id: s.id as string,
        set_number: s.set_number as number,
        reps: (s.reps as number | null) ?? null,
        weight_kg: (s.weight_kg as number | null) ?? null,
        rpe: (s.rpe as number | null) ?? null,
        rir: (s.rir as number | null) ?? null,
        is_warmup: !!s.is_warmup,
        is_completed: !!s.is_completed,
        failed_at_set: !!s.failed_at_set,
        set_kind: ((s.set_kind as string | null) ?? "working") as
          | "working"
          | "warmup"
          | "drop"
          | "cluster"
          | "rest_pause"
          | "amrap",
        notes: (s.notes as string | null) ?? null,
      }),
    ),
  }));

  const tpl = session.workout_templates as unknown as { name: string } | null;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <RealtimeRefresher tazzleId={tazzleId} channels={["sessions"]} />
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{tpl?.name ?? "Freestyle"}</h1>
          <p className="text-muted-foreground text-sm">
            Started {new Date(session.started_at as string).toLocaleString()}
            {isFinished && (
              <>
                {" "}
                · Done{" "}
                {new Date(session.completed_at as string).toLocaleString()}
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/sessions">All sessions</Link>
          </Button>
          {isOwner && (
            <form action={deleteSessionAction}>
              <input type="hidden" name="id" value={id} />
              <Button type="submit" variant="ghost" size="icon" className="text-destructive">
                <Trash2 className="size-4" />
              </Button>
            </form>
          )}
        </div>
      </header>

      {shapedExercises.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No exercises yet — add one below.
        </p>
      ) : null}

      <SessionLogger
        sessionId={id}
        isOwner={isOwner}
        isFinished={isFinished}
        exercises={shapedExercises}
        exerciseOptions={exerciseOptions}
        units={await getUserUnits()}
      />

      {isFinished && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tazzle reactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Reactions
              subjectKind="workout_session"
              subjectId={id}
              reactions={(await getReactions("workout_session", id)).map(
                (r) => ({
                  id: r.id as string,
                  kind: r.kind as string,
                  user_id: r.user_id as string,
                }),
              )}
              myUserId={user?.id ?? null}
              path={`/sessions/${id}`}
            />
            <Comments
              subjectKind="workout_session"
              subjectId={id}
              comments={(await getComments("workout_session", id)).map((c) => ({
                id: c.id as string,
                user_id: c.user_id as string,
                parent_id: (c.parent_id as string | null) ?? null,
                body: c.body as string,
                created_at: c.created_at as string,
              }))}
              myUserId={user?.id ?? null}
              displayNames={Object.fromEntries(
                await (async () => {
                  const cs = await getComments("workout_session", id);
                  const ids = Array.from(
                    new Set(cs.map((c) => c.user_id as string)),
                  );
                  const map = await lookupDisplayNames(ids);
                  return Array.from(map.entries());
                })(),
              )}
              path={`/sessions/${id}`}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
