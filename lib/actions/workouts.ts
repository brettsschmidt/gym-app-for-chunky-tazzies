"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createTemplateSchema,
  updateTemplateSchema,
  type TemplateExerciseLine,
} from "@/lib/schemas/workouts";

function parsePayload(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function createTemplateAction(formData: FormData) {
  const payload = parsePayload(formData.get("payload"));
  const parsed = createTemplateSchema.safeParse(payload);
  if (!parsed.success) {
    redirect("/workouts/new?error=invalid_input");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tpl, error } = await supabase
    .from("workout_templates")
    .insert({
      chunky_tazzle_id: parsed.data.chunky_tazzle_id,
      name: parsed.data.name,
      notes: parsed.data.notes ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !tpl) redirect("/workouts/new?error=create_failed");

  if (parsed.data.lines.length) {
    await insertLines(
      supabase,
      tpl.id as string,
      parsed.data.chunky_tazzle_id,
      user.id,
      parsed.data.lines,
    );
  }

  revalidatePath("/workouts");
  redirect(`/workouts/${tpl.id}`);
}

export async function updateTemplateAction(formData: FormData) {
  const payload = parsePayload(formData.get("payload"));
  const parsed = updateTemplateSchema.safeParse(payload);
  if (!parsed.success) {
    redirect(`/workouts?error=invalid_input`);
  }

  const supabase = await createSupabaseServerClient();
  const id = parsed.data.id;
  await supabase
    .from("workout_templates")
    .update({
      name: parsed.data.name,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", id);

  await supabase.from("workout_template_exercises").delete().eq("workout_template_id", id);
  if (parsed.data.lines.length) {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (!u) redirect("/login");
    await insertLines(
      supabase,
      id,
      parsed.data.chunky_tazzle_id,
      u.id,
      parsed.data.lines,
    );
  }
  revalidatePath(`/workouts/${id}`);
  redirect(`/workouts/${id}`);
}

export async function deleteTemplateAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("workout_templates").delete().eq("id", id);
  revalidatePath("/workouts");
  redirect("/workouts");
}

async function insertLines(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  templateId: string,
  tazzleId: string,
  userId: string,
  lines: TemplateExerciseLine[],
) {
  // Resolve exercise_name → exercise_id, creating tazzle-scoped exercises
  // for any names that don't match an existing one.
  const resolved: (TemplateExerciseLine & { exercise_id: string })[] = [];
  for (const l of lines) {
    let exerciseId = l.exercise_id;
    if (!exerciseId && l.exercise_name) {
      const name = l.exercise_name;
      const { data: existing } = await supabase
        .from("exercises")
        .select("id")
        .eq("name", name)
        .or(`chunky_tazzle_id.is.null,chunky_tazzle_id.eq.${tazzleId}`)
        .limit(1)
        .maybeSingle();
      if (existing) {
        exerciseId = existing.id as string;
      } else {
        const { data: created } = await supabase
          .from("exercises")
          .insert({
            name,
            chunky_tazzle_id: tazzleId,
            created_by: userId,
          })
          .select("id")
          .single();
        exerciseId = (created?.id as string | undefined) ?? undefined;
      }
    }
    if (!exerciseId) continue;
    resolved.push({ ...l, exercise_id: exerciseId });
  }
  if (!resolved.length) return;

  const rows = resolved.map((l, idx) => ({
    workout_template_id: templateId,
    exercise_id: l.exercise_id,
    position: l.position ?? idx,
    target_sets: l.target_sets ?? null,
    target_reps_min: l.target_reps_min ?? null,
    target_reps_max: l.target_reps_max ?? null,
    target_weight_kg: l.target_weight_kg ?? null,
    target_rpe: l.target_rpe ?? null,
    rest_seconds: l.rest_seconds ?? null,
    superset_group: l.superset_group ?? null,
    progression_rule: l.progression_rule ?? { kind: "none" },
  }));
  await supabase.from("workout_template_exercises").insert(rows);
}
