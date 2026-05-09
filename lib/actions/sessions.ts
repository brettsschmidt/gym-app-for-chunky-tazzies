"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  copyLastSessionSchema,
  finishSessionSchema,
  insertWarmupSchema,
  repeatLastSetSchema,
  startSessionSchema,
  upsertSetSchema,
} from "@/lib/schemas/sessions";
import { buildWarmupRamp } from "@/lib/warmup";
import { epley1RM } from "@/lib/volume";
import { flashMascot } from "@/lib/mascot/flash";
import { displayToKg, type Units } from "@/lib/units";

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
        const setRows: Array<Record<string, unknown>> = [];
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
              set_kind: "working",
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
  // Bodyweight comes from the form in the user's display units; convert to kg
  // (the canonical storage unit) before validation.
  const rawBodyweight = formData.get("bodyweight_display") ?? formData.get("bodyweight_kg");
  const bodyweightUnits = (formData.get("bodyweight_units") as Units | null) ?? "metric";
  const bodyweightKg =
    typeof rawBodyweight === "string" && rawBodyweight.length > 0
      ? displayToKg(Number(rawBodyweight), bodyweightUnits)
      : undefined;

  const parsed = finishSessionSchema.safeParse({
    id: formData.get("id"),
    bodyweight_kg: bodyweightKg,
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

  await flashMascot("session_done");
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

interface UpsertResult {
  setId: string | null;
  prHit: boolean;
  prKind?: string;
  prValue?: number;
  exerciseName?: string;
}

export async function upsertSetAction(
  formData: FormData,
): Promise<UpsertResult> {
  const parsed = upsertSetSchema.safeParse({
    id: formData.get("id") || undefined,
    session_exercise_id: formData.get("session_exercise_id"),
    set_number: formData.get("set_number"),
    reps: formData.get("reps") || undefined,
    weight_kg: formData.get("weight_kg") || undefined,
    rpe: formData.get("rpe") || undefined,
    rir: formData.get("rir") || undefined,
    is_warmup: formData.get("is_warmup") === "true",
    is_completed: formData.get("is_completed") === "true",
    failed_at_set: formData.get("failed_at_set") === "true",
    set_kind: formData.get("set_kind") || undefined,
    parent_set_id: formData.get("parent_set_id") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { setId: null, prHit: false };

  const supabase = await createSupabaseServerClient();
  const payload = {
    reps: parsed.data.reps ?? null,
    weight_kg: parsed.data.weight_kg ?? null,
    rpe: parsed.data.rpe ?? null,
    rir: parsed.data.rir ?? null,
    is_warmup: parsed.data.is_warmup ?? false,
    is_completed: parsed.data.is_completed ?? false,
    failed_at_set: parsed.data.failed_at_set ?? false,
    set_kind: parsed.data.set_kind ?? "working",
    parent_set_id: parsed.data.parent_set_id ?? null,
    notes: parsed.data.notes ?? null,
  } as Record<string, unknown>;

  // Capture prior PR before the trigger updates it so we can detect a new best.
  let priorBest1RM = 0;
  let exerciseId: string | null = null;
  let userId: string | null = null;
  let exerciseName: string | null = null;

  if (
    payload.is_completed === true &&
    payload.is_warmup === false &&
    parsed.data.reps != null &&
    parsed.data.weight_kg != null &&
    parsed.data.weight_kg > 0
  ) {
    const { data: seRow } = await supabase
      .from("session_exercises")
      .select("exercise_id, session_id")
      .eq("id", parsed.data.session_exercise_id)
      .single();
    exerciseId = (seRow?.exercise_id as string | undefined) ?? null;
    if (seRow?.session_id) {
      const { data: sessRow } = await supabase
        .from("workout_sessions")
        .select("user_id")
        .eq("id", seRow.session_id as string)
        .single();
      userId = (sessRow?.user_id as string | undefined) ?? null;
    }
    if (exerciseId && userId) {
      const { data: existing } = await supabase
        .from("personal_records")
        .select("value_numeric")
        .eq("user_id", userId)
        .eq("exercise_id", exerciseId)
        .eq("kind", "1rm")
        .maybeSingle();
      priorBest1RM = (existing?.value_numeric as number | undefined) ?? 0;
      const { data: ex } = await supabase
        .from("exercises")
        .select("name")
        .eq("id", exerciseId)
        .single();
      exerciseName = (ex?.name as string | undefined) ?? null;
    }
  }

  let setId: string | null = parsed.data.id ?? null;
  if (parsed.data.id) {
    await supabase.from("session_sets").update(payload).eq("id", parsed.data.id);
  } else {
    const { data } = await supabase
      .from("session_sets")
      .insert({
        session_exercise_id: parsed.data.session_exercise_id,
        set_number: parsed.data.set_number,
        ...payload,
      })
      .select("id")
      .single();
    setId = (data?.id as string | undefined) ?? null;
  }

  let result: UpsertResult = { setId, prHit: false };
  if (
    setId &&
    payload.is_completed === true &&
    payload.is_warmup === false &&
    parsed.data.reps != null &&
    parsed.data.weight_kg != null &&
    parsed.data.weight_kg > 0 &&
    exerciseId &&
    userId
  ) {
    const candidate1RM = epley1RM(parsed.data.weight_kg, parsed.data.reps);
    if (candidate1RM > priorBest1RM + 0.001) {
      result = {
        setId,
        prHit: true,
        prKind: "1rm",
        prValue: candidate1RM,
        exerciseName: exerciseName ?? undefined,
      };
      await supabase.from("notifications").insert({
        user_id: userId,
        kind: "pr_hit",
        title: "New PR!",
        body: `${exerciseName ?? "Exercise"} estimated 1RM: ${candidate1RM.toFixed(1)} kg`,
        subject_kind: "personal_record",
        subject_id: setId,
        link_path: `/exercises/${exerciseId}`,
      });
    }
  }

  const sessionPath = formData.get("session_path");
  if (typeof sessionPath === "string") revalidatePath(sessionPath);
  return result;
}

export async function deleteSetAction(formData: FormData) {
  const id = formData.get("id");
  const sessionPath = formData.get("session_path");
  if (typeof id !== "string") return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("session_sets").delete().eq("id", id);
  if (typeof sessionPath === "string") revalidatePath(sessionPath);
}

export async function repeatLastSetAction(formData: FormData) {
  const parsed = repeatLastSetSchema.safeParse({
    session_exercise_id: formData.get("session_exercise_id"),
  });
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();

  const { data: last } = await supabase
    .from("session_sets")
    .select("set_number, reps, weight_kg, rpe, rir, is_warmup, set_kind, notes")
    .eq("session_exercise_id", parsed.data.session_exercise_id)
    .order("set_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const next = ((last?.set_number as number | undefined) ?? 0) + 1;
  await supabase.from("session_sets").insert({
    session_exercise_id: parsed.data.session_exercise_id,
    set_number: next,
    reps: (last?.reps as number | null) ?? null,
    weight_kg: (last?.weight_kg as number | null) ?? null,
    rpe: (last?.rpe as number | null) ?? null,
    rir: (last?.rir as number | null) ?? null,
    is_warmup: (last?.is_warmup as boolean | null) ?? false,
    set_kind: (last?.set_kind as string | null) ?? "working",
    notes: (last?.notes as string | null) ?? null,
    is_completed: false,
  });

  const sessionPath = formData.get("session_path");
  if (typeof sessionPath === "string") revalidatePath(sessionPath);
}

export async function insertWarmupAction(formData: FormData) {
  const parsed = insertWarmupSchema.safeParse({
    session_exercise_id: formData.get("session_exercise_id"),
    working_weight_kg: formData.get("working_weight_kg"),
    working_reps: formData.get("working_reps") || undefined,
  });
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();

  const ramp = buildWarmupRamp(
    parsed.data.working_weight_kg,
    parsed.data.working_reps,
  );
  if (ramp.length === 0) return;

  // Shift existing sets down so warmup occupies set_number 1..ramp.length
  const { data: existing } = await supabase
    .from("session_sets")
    .select("id, set_number")
    .eq("session_exercise_id", parsed.data.session_exercise_id)
    .order("set_number", { ascending: true });

  if (existing?.length) {
    // Renumber starting after the warmup, going from highest to lowest to avoid
    // unique-constraint collisions during the update.
    const shifted = [...existing].reverse();
    for (const row of shifted) {
      const oldNum = row.set_number as number;
      const newNum = oldNum + ramp.length;
      await supabase
        .from("session_sets")
        .update({ set_number: newNum })
        .eq("id", row.id as string);
    }
  }

  await supabase.from("session_sets").insert(
    ramp.map((w) => ({
      session_exercise_id: parsed.data.session_exercise_id,
      set_number: w.set_number,
      reps: w.reps,
      weight_kg: w.weight_kg,
      is_warmup: true,
      set_kind: "warmup",
      is_completed: false,
    })),
  );

  const sessionPath = formData.get("session_path");
  if (typeof sessionPath === "string") revalidatePath(sessionPath);
}

export async function copyLastSessionAction(formData: FormData) {
  const parsed = copyLastSessionSchema.safeParse({
    workout_template_id: formData.get("workout_template_id"),
    chunky_tazzle_id: formData.get("chunky_tazzle_id"),
  });
  if (!parsed.success) redirect("/sessions/new?error=invalid_input");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Find the user's most recent completed session for this template
  const { data: prev } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("workout_template_id", parsed.data.workout_template_id)
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: created } = await supabase
    .from("workout_sessions")
    .insert({
      chunky_tazzle_id: parsed.data.chunky_tazzle_id,
      workout_template_id: parsed.data.workout_template_id,
      user_id: user.id,
    })
    .select("id")
    .single();
  if (!created?.id) redirect("/sessions/new?error=create_failed");
  const newSessionId = created.id as string;

  if (prev?.id) {
    const { data: prevExs } = await supabase
      .from("session_exercises")
      .select("id, exercise_id, position")
      .eq("session_id", prev.id as string)
      .order("position");

    if (prevExs?.length) {
      const { data: newExs } = await supabase
        .from("session_exercises")
        .insert(
          prevExs.map((e) => ({
            session_id: newSessionId,
            exercise_id: e.exercise_id as string,
            position: e.position as number,
          })),
        )
        .select("id, exercise_id, position");

      if (newExs?.length) {
        for (const newEx of newExs) {
          const prevEx = prevExs.find(
            (p) =>
              p.exercise_id === newEx.exercise_id &&
              p.position === newEx.position,
          );
          if (!prevEx) continue;
          const { data: prevSets } = await supabase
            .from("session_sets")
            .select(
              "set_number, reps, weight_kg, rpe, is_warmup, set_kind",
            )
            .eq("session_exercise_id", prevEx.id as string)
            .order("set_number");
          if (prevSets?.length) {
            await supabase.from("session_sets").insert(
              prevSets.map((s) => ({
                session_exercise_id: newEx.id as string,
                set_number: s.set_number as number,
                reps: s.reps as number | null,
                weight_kg: s.weight_kg as number | null,
                rpe: s.rpe as number | null,
                is_warmup: (s.is_warmup as boolean | null) ?? false,
                set_kind: (s.set_kind as string | null) ?? "working",
                is_completed: false,
              })),
            );
          }
        }
      }
    }
  }

  revalidatePath("/sessions");
  redirect(`/sessions/${newSessionId}`);
}
