import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listBodyMetrics() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("body_metrics")
    .select(
      "id, measured_at, weight_kg, body_fat_pct, waist_cm, chest_cm, arm_cm, thigh_cm, notes",
    )
    .eq("user_id", user.id)
    .order("measured_at", { ascending: true })
    .limit(365);
  return data ?? [];
}
