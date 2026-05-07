"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function saveUserPrefsAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const payload: Record<string, unknown> = {
    user_id: user.id,
    display_name: (formData.get("display_name") as string) || null,
    units: (formData.get("units") as string) ?? "metric",
    theme: (formData.get("theme") as string) ?? "auto",
    sex: (formData.get("sex") as string) || null,
    height_cm: Number(formData.get("height_cm") ?? 0) || null,
    birth_date: (formData.get("birth_date") as string) || null,
    timezone: (formData.get("timezone") as string) || "UTC",
  };
  await supabase.from("user_prefs").upsert(payload);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function completeOnboardingAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const payload: Record<string, unknown> = {
    user_id: user.id,
    display_name: (formData.get("display_name") as string) || null,
    units: (formData.get("units") as string) ?? "metric",
    sex: (formData.get("sex") as string) || null,
    height_cm: Number(formData.get("height_cm") ?? 0) || null,
    birth_date: (formData.get("birth_date") as string) || null,
    goal: (formData.get("goal") as string) || null,
    experience: (formData.get("experience") as string) || null,
    weekly_session_target: Number(formData.get("weekly_session_target") ?? 4),
    onboarded_at: new Date().toISOString(),
  };
  await supabase.from("user_prefs").upsert(payload);
  revalidatePath("/dashboard");
}
