import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listMyPRs() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("personal_records")
    .select(
      "exercise_id, kind, value_numeric, value_secondary, achieved_at, exercises(name,slug)",
    )
    .eq("user_id", user.id)
    .order("achieved_at", { ascending: false })
    .limit(200);
  return data ?? [];
}

export async function listStrengthStandards() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("strength_standards")
    .select("*");
  return data ?? [];
}

export async function getExerciseHistory(exerciseId: string, limit = 60) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: rows } = await supabase
    .from("session_sets")
    .select(
      "id, set_number, reps, weight_kg, rpe, is_warmup, is_completed, failed_at_set, created_at, session_exercises!inner(exercise_id, session_id, workout_sessions!inner(user_id, started_at))",
    )
    .eq("session_exercises.exercise_id", exerciseId)
    .eq("session_exercises.workout_sessions.user_id", user.id)
    .eq("is_warmup", false)
    .eq("is_completed", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  return rows ?? [];
}
