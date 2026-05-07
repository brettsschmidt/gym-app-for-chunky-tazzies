import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Export the current user's gym data as a single JSON blob — sessions, sets,
 * meals, body metrics, prefs. Trivial enough to expand into a ZIP later;
 * keeping it as JSON keeps deps lean.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const [
    sessions,
    setsByEx,
    meals,
    mealItems,
    bodyMetrics,
    prs,
    targets,
    waterLogs,
    sleep,
    wellness,
    prefs,
    progressPhotos,
  ] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select(
        "id, started_at, completed_at, bodyweight_kg, perceived_effort, notes, workout_template_id, chunky_tazzle_id",
      )
      .eq("user_id", user.id),
    supabase
      .from("session_exercises")
      .select(
        "id, session_id, exercise_id, position, notes, session_sets(*)",
      )
      .in(
        "session_id",
        // Filter is safer with explicit scope: sessions belong to this user.
        (
          await supabase
            .from("workout_sessions")
            .select("id")
            .eq("user_id", user.id)
        ).data?.map((r) => r.id as string) ?? [],
      ),
    supabase
      .from("nutrition_meals")
      .select("*")
      .eq("user_id", user.id),
    supabase
      .from("nutrition_meal_items")
      .select("*")
      .in(
        "meal_id",
        (
          await supabase
            .from("nutrition_meals")
            .select("id")
            .eq("user_id", user.id)
        ).data?.map((r) => r.id as string) ?? [],
      ),
    supabase.from("body_metrics").select("*").eq("user_id", user.id),
    supabase.from("personal_records").select("*").eq("user_id", user.id),
    supabase
      .from("nutrition_targets")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("water_logs").select("*").eq("user_id", user.id),
    supabase.from("sleep_logs").select("*").eq("user_id", user.id),
    supabase.from("daily_wellness").select("*").eq("user_id", user.id),
    supabase
      .from("user_prefs")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("progress_photos").select("*").eq("user_id", user.id),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    sessions: sessions.data ?? [],
    session_exercises: setsByEx.data ?? [],
    meals: meals.data ?? [],
    meal_items: mealItems.data ?? [],
    body_metrics: bodyMetrics.data ?? [],
    personal_records: prs.data ?? [],
    nutrition_targets: targets.data ?? null,
    water_logs: waterLogs.data ?? [],
    sleep_logs: sleep.data ?? [],
    daily_wellness: wellness.data ?? [],
    user_prefs: prefs.data ?? null,
    progress_photos: progressPhotos.data ?? [],
  };

  const filename = `chunky-tazzies-export-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
