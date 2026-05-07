import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listTemplates(tazzleId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("workout_templates")
    .select("id, name, notes, updated_at")
    .eq("chunky_tazzle_id", tazzleId)
    .order("updated_at", { ascending: false });
  return data ?? [];
}

export async function getTemplate(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: template } = await supabase
    .from("workout_templates")
    .select("id, name, notes, chunky_tazzle_id, created_by, updated_at")
    .eq("id", id)
    .single();
  if (!template) return null;

  const { data: lines } = await supabase
    .from("workout_template_exercises")
    .select(
      "id, exercise_id, position, target_sets, target_reps_min, target_reps_max, target_weight_kg, target_rpe, rest_seconds, superset_group, progression_rule, exercises(id,name,slug)",
    )
    .eq("workout_template_id", id)
    .order("position", { ascending: true });

  return { template, lines: lines ?? [] };
}
