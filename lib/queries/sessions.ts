import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabasePublicServerClient } from "@/lib/supabase/public-client";

export async function getRecentSessions(tazzleId: string, limit = 20) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("workout_sessions")
    .select(
      "id, user_id, started_at, completed_at, workout_template_id, workout_templates(name)",
    )
    .eq("chunky_tazzle_id", tazzleId)
    .order("started_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getSession(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: session } = await supabase
    .from("workout_sessions")
    .select(
      "id, user_id, chunky_tazzle_id, started_at, completed_at, bodyweight_kg, perceived_effort, notes, workout_template_id, workout_templates(name)",
    )
    .eq("id", id)
    .single();
  if (!session) return null;

  const { data: rows } = await supabase
    .from("session_exercises")
    .select(
      "id, exercise_id, position, notes, exercises(id,name,slug)",
    )
    .eq("session_id", id)
    .order("position");

  const exerciseIds = (rows ?? []).map((r) => r.id as string);
  const setsByExercise: Record<string, unknown[]> = {};
  if (exerciseIds.length) {
    const { data: sets } = await supabase
      .from("session_sets")
      .select(
        "id, session_exercise_id, set_number, reps, weight_kg, rpe, is_warmup, is_completed, rest_seconds_actual",
      )
      .in("session_exercise_id", exerciseIds)
      .order("set_number");
    for (const s of sets ?? []) {
      const k = s.session_exercise_id as string;
      (setsByExercise[k] ||= []).push(s);
    }
  }

  return { session, exercises: rows ?? [], setsByExercise };
}

export async function lookupDisplayNames(userIds: string[]) {
  if (!userIds.length) return new Map<string, string | null>();
  const pub = await createSupabasePublicServerClient();
  const { data } = await pub
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);
  return new Map<string, string | null>(
    (data ?? []).map((p) => [p.id as string, (p.display_name as string) ?? null]),
  );
}
