import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listExercises(opts: {
  tazzleId: string;
  search?: string;
  muscleSlug?: string;
  equipmentSlug?: string;
}) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("exercises")
    .select(
      "id, name, slug, chunky_tazzle_id, video_url, is_unilateral, primary_muscle_id, equipment_id, muscle_groups!exercises_primary_muscle_id_fkey(slug,name), equipment(slug,name)",
    )
    .or(`chunky_tazzle_id.is.null,chunky_tazzle_id.eq.${opts.tazzleId}`)
    .order("name", { ascending: true })
    .limit(200);

  if (opts.search?.trim()) {
    query = query.ilike("name", `%${opts.search.trim()}%`);
  }
  const { data } = await query;
  let rows = data ?? [];

  if (opts.muscleSlug) {
    rows = rows.filter((r) => {
      const mg = r.muscle_groups as unknown as { slug: string } | null;
      return mg?.slug === opts.muscleSlug;
    });
  }
  if (opts.equipmentSlug) {
    rows = rows.filter((r) => {
      const eq = r.equipment as unknown as { slug: string } | null;
      return eq?.slug === opts.equipmentSlug;
    });
  }

  return rows;
}

export async function listMuscleGroups() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("muscle_groups")
    .select("id, slug, name, body_region")
    .order("name");
  return data ?? [];
}

export async function listEquipment() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("equipment")
    .select("id, slug, name, category")
    .order("name");
  return data ?? [];
}

export async function getExercise(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("exercises")
    .select(
      "id, name, slug, description, instructions, video_url, is_unilateral, chunky_tazzle_id, primary_muscle_id, equipment_id, muscle_groups!exercises_primary_muscle_id_fkey(name,slug), equipment(name,slug)",
    )
    .eq("id", id)
    .single();
  return data;
}
