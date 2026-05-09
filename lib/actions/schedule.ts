"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveTazzleId } from "@/lib/active-tazzle";

export async function saveScheduleAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");

  // Form fields: day_0, day_1, … day_6 — each value is a template id or "" for off.
  const rows: { day_of_week: number; workout_template_id: string }[] = [];
  for (let day = 0; day < 7; day++) {
    const v = formData.get(`day_${day}`);
    if (typeof v === "string" && v.length > 0) {
      rows.push({ day_of_week: day, workout_template_id: v });
    }
  }

  // Replace strategy: delete this user's schedule for the tazzle, insert what's set.
  await supabase
    .from("weekly_schedules")
    .delete()
    .eq("user_id", user.id)
    .eq("chunky_tazzle_id", tazzleId);

  if (rows.length) {
    const { error } = await supabase.from("weekly_schedules").insert(
      rows.map((r) => ({
        user_id: user.id,
        chunky_tazzle_id: tazzleId,
        day_of_week: r.day_of_week,
        workout_template_id: r.workout_template_id,
      })),
    );
    if (error) {
      redirect("/workouts/schedule?error=save_failed");
    }
  }

  revalidatePath("/workouts/schedule");
  revalidatePath("/sessions/new");
  redirect("/workouts/schedule?saved=1");
}
