"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseStrongCsv } from "@/lib/importers/strong";

export async function importStrongCsvAction(formData: FormData): Promise<{
  sessions: number;
  exercises: number;
  sets: number;
}> {
  const csv = formData.get("csv");
  const tazzleId = formData.get("chunky_tazzle_id");
  if (typeof csv !== "string" || typeof tazzleId !== "string") {
    return { sessions: 0, exercises: 0, sets: 0 };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sessions: 0, exercises: 0, sets: 0 };

  const parsed = parseStrongCsv(csv);

  // Build a name → id map of accessible exercises (global + this tazzle)
  const { data: catalog } = await supabase
    .from("exercises")
    .select("id, name")
    .or(`chunky_tazzle_id.is.null,chunky_tazzle_id.eq.${tazzleId}`);
  const byName = new Map<string, string>(
    (catalog ?? []).map((e) => [
      (e.name as string).toLowerCase().trim(),
      e.id as string,
    ]),
  );

  let sessionsCount = 0;
  let exCount = 0;
  let setCount = 0;

  for (const s of parsed) {
    const { data: createdSession } = await supabase
      .from("workout_sessions")
      .insert({
        chunky_tazzle_id: tazzleId,
        user_id: user.id,
        started_at: s.started_at,
        completed_at: s.started_at,
        notes: s.notes,
      })
      .select("id")
      .single();
    if (!createdSession?.id) continue;
    sessionsCount += 1;

    for (let i = 0; i < s.exercises.length; i++) {
      const ex = s.exercises[i];
      const lookup = byName.get(ex.exercise_name.toLowerCase().trim());
      let exerciseId: string | null = lookup ?? null;
      if (!exerciseId) {
        // Create a custom exercise so the import isn't lossy
        const slug = ex.exercise_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 60);
        const { data: created } = await supabase
          .from("exercises")
          .insert({
            chunky_tazzle_id: tazzleId,
            name: ex.exercise_name,
            slug: `${slug}-${Math.floor(Math.random() * 9999)}`,
            created_by: user.id,
          })
          .select("id")
          .single();
        exerciseId = (created?.id as string | undefined) ?? null;
        if (exerciseId) {
          byName.set(ex.exercise_name.toLowerCase().trim(), exerciseId);
        }
      }
      if (!exerciseId) continue;

      const { data: createdSE } = await supabase
        .from("session_exercises")
        .insert({
          session_id: createdSession.id as string,
          exercise_id: exerciseId,
          position: i,
        })
        .select("id")
        .single();
      if (!createdSE?.id) continue;
      exCount += 1;

      if (ex.sets.length) {
        await supabase.from("session_sets").insert(
          ex.sets.map((set) => ({
            session_exercise_id: createdSE.id as string,
            set_number: set.set_number,
            weight_kg: set.weight_kg,
            reps: set.reps,
            rpe: set.rpe,
            notes: set.notes,
            is_warmup: set.is_warmup,
            is_completed: true,
            set_kind: set.is_warmup ? "warmup" : "working",
          })),
        );
        setCount += ex.sets.length;
      }
    }
  }

  revalidatePath("/sessions");
  return { sessions: sessionsCount, exercises: exCount, sets: setCount };
}
