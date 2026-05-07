import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listPrograms(tazzleId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("programs")
    .select("id, name, description, weeks_count, updated_at")
    .eq("chunky_tazzle_id", tazzleId)
    .order("updated_at", { ascending: false });
  return data ?? [];
}

export async function getProgram(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: program } = await supabase
    .from("programs")
    .select("*")
    .eq("id", id)
    .single();
  if (!program) return null;
  const { data: slots } = await supabase
    .from("program_workouts")
    .select(
      "id, week_number, day_of_week, position, workout_template_id, workout_templates(id,name)",
    )
    .eq("program_id", id)
    .order("week_number")
    .order("day_of_week")
    .order("position");
  return { program, slots: slots ?? [] };
}
