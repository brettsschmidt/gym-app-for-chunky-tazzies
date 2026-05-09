import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Units } from "@/lib/units";

/** Resolve the active user's display units. Defaults to imperial. */
export async function getUserUnits(): Promise<Units> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "imperial";

  const { data } = await supabase
    .from("user_prefs")
    .select("units")
    .eq("user_id", user.id)
    .maybeSingle();
  const u = data?.units as string | undefined;
  return u === "metric" ? "metric" : "imperial";
}
