import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listMyPRs() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("personal_records")
    .select(
      "exercise_id, kind, value_numeric, value_secondary, achieved_at, exercises(name,slug)",
    )
    .eq("user_id", user.id)
    .order("achieved_at", { ascending: false })
    .limit(200);
  return data ?? [];
}
