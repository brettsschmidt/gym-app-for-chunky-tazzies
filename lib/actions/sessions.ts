"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  finishSessionSchema,
  startSessionSchema,
  upsertSetSchema,
} from "@/lib/schemas/sessions";

export async function startSessionAction(formData: FormData) {
  const parsed = startSessionSchema.safeParse({
    chunky_tazzle_id: formData.get("chunky_tazzle_id"),
    workout_template_id: formData.get("workout_template_id") || undefined,
  });
  if (!parsed.success) redirect("/sessions/new?error=invalid_input");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session, error } = await supabase
    .from("workout_sessions")
    .insert({
      chunky_tazzle_id: parsed.data.chunky_tazzle_id,
      workout_template_id: parsed.data.workout_template_id ?? null,
      user_id: user.id,
    })
    .select("id")
    .single();
  if (error || !session) redirect("/sessions/new?error=create_failed");

  // If a template was selected, copy its exercise lines into session_exercises +
  // pre-create the planned sets (uncompleted) so the user just has to fill numbers.
  if (parsed.data.workout_template_id) {
    const { data: lines } = await supabase
      .from("workout_template_exercises")
      .select(
        "exercise_id, position, target_sets, target_reps_min, target_weight_kg, target_rpe, rest_seconds",
      )
      .eq("workout_template_id", parsed.data.workout_template_id)
      .order("position");

    if (lines?.length) {
      const seRows = lines.map((l) => ({
        session_id: session.id as string,
        exercise_id: l.exercise_id as string,
        position: l.position as number,
      }));
      const { data: createdSE } = await supabase
        .from("session_exercises")
        .insert(seRows)
        .select("id, exercise_id, position");

      if (createdSE?.length) {
        const setRows: {
          session_exercise_id: string;
          set_number: number;
          reps: number | null;
          weight_kg: number | null;
          rpe: number | null;
          is_warmup: boolean;
          is_completed: boolean;
        }[] = [];
        for (const se of createdSE) {
          const matching = lines.find(
            (l) => l.exercise_id === se.exercise_id && l.position === se.position,
          );
          const target = (matching?.target_sets as number | null) ?? 3;
          for (let i = 1; i <= target; i++) {
            setRows.push({
              session_exercise_id: se.id as string,
              set_number: i,
              reps: (matching?.target_reps_min as number | null) ?? null,
              weight_kg: (matching?.target_weight_kg as number | null) ?? null,
              rpe: (matching?.target_rpe as number | null) ?? null,
              is_warmup: false,
              is_completed: false,
            });
          }
        }
        if (setRows.length) {
          await supabase.from("session_sets").insert(setRows);
        }
      }
    }
  }

  revalidatePath("/sessions");
  redirect(`/sessions/${session.id}`);
}

export async function finishSessionAction(formData: FormData) {
  const parsed = finishSessionSchema.safeParse({
    id: formData.get("id"),
    bodyweight_kg: formData.get("bodyweight_kg") || undefined,
    perceived_effort: formData.get("perceived_effort") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("workout_sessions")
    .update({
      completed_at: new Date().toISOString(),
      bodyweight_kg: parsed.data.bodyweight_kg ?? null,
      perceived_effort: parsed.data.perceived_effort ?? null,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", parsed.data.id);

  revalidatePath(`/sessions/${parsed.data.id}`);
  revalidatePath("/sessions");
  redirect(`/sessions/${parsed.data.id}`);
}

export async function deleteSessionAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("workout_sessions").delete().eq("id", id);
  revalidatePath("/sessions");
  redirect("/sessions");
}

export async function addExerciseToSessionAction(formData: FormData) {
  const sessionId = formData.get("session_id");
  const exerciseId = formData.get("exercise_id");
  const position = Number(formData.get("position") ?? 0);
  if (typeof sessionId !== "string" || typeof exerciseId !== "string") return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("session_exercises").insert({
    session_id: sessionId,
    exercise_id: exerciseId,
    position,
  });
  revalidatePath(`/sessions/${sessionId}`);
}

export async function upsertSetAction(formData: FormData) {
  const parsed = upsertSetSchema.safeParse({
    id: formData.get("id") || undefined,
    session_exercise_id: formData.get("session_exercise_id"),
    set_number: formData.get("set_number"),
    reps: formData.get("reps") || undefined,
    weight_kg: formData.get("weight_kg") || undefined,
    rpe: formData.get("rpe") || undefined,
    is_warmup: formData.get("is_warmup") === "true",
    is_completed: formData.get("is_completed") === "true",
  });
  if (!parsed.success) return;

  const supabase = await createSupabaseServerClient();
  if (parsed.data.id) {
    await supabase
      .from("session_sets")
      .update({
        reps: parsed.data.reps ?? null,
        weight_kg: parsed.data.weight_kg ?? null,
        rpe: parsed.data.rpe ?? null,
        is_warmup: parsed.data.is_warmup ?? false,
        is_completed: parsed.data.is_completed ?? false,
      })
      .eq("id", parsed.data.id);
  } else {
    await supabase.from("session_sets").insert({
      session_exercise_id: parsed.data.session_exercise_id,
      set_number: parsed.data.set_number,
      reps: parsed.data.reps ?? null,
      weight_kg: parsed.data.weight_kg ?? null,
      rpe: parsed.data.rpe ?? null,
      is_warmup: parsed.data.is_warmup ?? false,
      is_completed: parsed.data.is_completed ?? false,
    });
  }

  const sessionPath = formData.get("session_path");
  if (typeof sessionPath === "string") revalidatePath(sessionPath);
}

export async function deleteSetAction(formData: FormData) {
  const id = formData.get("id");
  const sessionPath = formData.get("session_path");
  if (typeof id !== "string") return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("session_sets").delete().eq("id", id);
  if (typeof sessionPath === "string") revalidatePath(sessionPath);
}
