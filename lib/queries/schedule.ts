import { createSupabaseServerClient } from "@/lib/supabase/server";

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export interface ScheduleRow {
  day_of_week: number;
  workout_template_id: string;
  template_name: string;
}

export async function getSchedule(
  tazzleId: string,
): Promise<Map<number, ScheduleRow>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const map = new Map<number, ScheduleRow>();
  if (!user) return map;

  const { data } = await supabase
    .from("weekly_schedules")
    .select("day_of_week, workout_template_id, workout_templates(id,name)")
    .eq("user_id", user.id)
    .eq("chunky_tazzle_id", tazzleId);

  for (const row of data ?? []) {
    const rel = row.workout_templates as
      | { id: string; name: string }
      | { id: string; name: string }[]
      | null;
    const tmpl = Array.isArray(rel) ? rel[0] : rel;
    if (!tmpl) continue;
    map.set(row.day_of_week as number, {
      day_of_week: row.day_of_week as number,
      workout_template_id: row.workout_template_id as string,
      template_name: tmpl.name,
    });
  }
  return map;
}

export function todayDow(): number {
  return new Date().getDay(); // 0 = Sunday
}
