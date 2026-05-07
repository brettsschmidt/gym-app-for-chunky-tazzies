"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateProgram } from "@/lib/program-templates";
import type { Experience, ProgramGoal } from "@/lib/program-templates";

function isGoal(s: string): s is ProgramGoal {
  return s === "strength" || s === "hypertrophy" || s === "general";
}
function isExperience(s: string): s is Experience {
  return s === "beginner" || s === "intermediate" || s === "advanced";
}

export async function generateProgramAction(formData: FormData) {
  const tazzleId = formData.get("chunky_tazzle_id");
  const goalRaw = (formData.get("goal") as string) ?? "general";
  const expRaw = (formData.get("experience") as string) ?? "intermediate";
  const days = Math.min(
    7,
    Math.max(2, Number(formData.get("days_per_week") ?? 4)),
  );
  if (typeof tazzleId !== "string") redirect("/programs?error=no_tazzle");
  const goal = isGoal(goalRaw) ? goalRaw : "general";
  const experience = isExperience(expRaw) ? expRaw : "intermediate";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Map slugs from the generator → real exercise ids accessible to this tazzle.
  const blueprint = generateProgram({ goal, experience, daysPerWeek: days });
  const slugs = Array.from(
    new Set(
      blueprint.templates.flatMap((t) => t.exercises.map((e) => e.exercise_slug)),
    ),
  );
  const { data: catalog } = await supabase
    .from("exercises")
    .select("id, slug")
    .or(`chunky_tazzle_id.is.null,chunky_tazzle_id.eq.${tazzleId}`)
    .in("slug", slugs);
  const idBySlug = new Map<string, string>(
    (catalog ?? []).map((e) => [e.slug as string, e.id as string]),
  );

  // Create the program shell first, then templates + lines.
  const { data: program } = await supabase
    .from("programs")
    .insert({
      chunky_tazzle_id: tazzleId,
      name: blueprint.name,
      description: blueprint.description,
      weeks_count: blueprint.weeks_count,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (!program?.id) redirect("/programs?error=program_create");
  const programId = program.id as string;

  const templateIds: string[] = [];
  for (const t of blueprint.templates) {
    const { data: tpl } = await supabase
      .from("workout_templates")
      .insert({
        chunky_tazzle_id: tazzleId,
        name: t.name,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (!tpl?.id) continue;
    const tplId = tpl.id as string;
    templateIds.push(tplId);

    const lines = t.exercises
      .map((e, idx) => {
        const exerciseId = idBySlug.get(e.exercise_slug);
        if (!exerciseId) return null;
        return {
          workout_template_id: tplId,
          exercise_id: exerciseId,
          position: idx,
          target_sets: e.target_sets,
          target_reps_min: e.target_reps_min,
          target_reps_max: e.target_reps_max,
          target_rpe: e.target_rpe ?? null,
          rest_seconds: e.rest_seconds,
          progression_rule: e.progression_rule ?? { kind: "none" },
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    if (lines.length) {
      await supabase.from("workout_template_exercises").insert(lines);
    }
  }

  // Build program_workouts schedule for the first week (clones for further weeks happen via copy)
  for (let week = 1; week <= blueprint.weeks_count; week++) {
    const isDeloadWeek =
      blueprint.weeks_count >= 4 && week === blueprint.weeks_count;
    const rows = Object.entries(blueprint.schedule)
      .map(([dow, idx]) => {
        const tplId = templateIds[idx as number];
        if (!tplId) return null;
        return {
          program_id: programId,
          week_number: week,
          day_of_week: Number(dow),
          workout_template_id: tplId,
          position: Number(dow),
          is_deload: isDeloadWeek,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    if (rows.length) await supabase.from("program_workouts").insert(rows);
  }

  revalidatePath("/programs");
  redirect(`/programs/${programId}`);
}
