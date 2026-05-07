"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function logCardioAction(formData: FormData) {
  const tazzleId = formData.get("chunky_tazzle_id");
  const mode = (formData.get("mode") as string) ?? "run";
  const duration_s = Number(formData.get("duration_s") ?? 0) || null;
  const distance_m = Number(formData.get("distance_m") ?? 0) || null;
  const avg_hr = Number(formData.get("avg_hr") ?? 0) || null;
  if (typeof tazzleId !== "string") return;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("cardio_sessions").insert({
    user_id: user.id,
    chunky_tazzle_id: tazzleId,
    mode,
    duration_s,
    distance_m,
    avg_hr,
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath("/cardio");
}

export async function logMobilityAction(formData: FormData) {
  const tazzleId = formData.get("chunky_tazzle_id");
  const routine = (formData.get("routine") as string)?.trim();
  if (typeof tazzleId !== "string" || !routine) return;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("mobility_logs").insert({
    user_id: user.id,
    chunky_tazzle_id: tazzleId,
    routine,
    duration_s: Number(formData.get("duration_s") ?? 0) || null,
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath("/mobility");
}

export async function logSleepAction(formData: FormData) {
  const started_at = formData.get("started_at") as string;
  const ended_at = formData.get("ended_at") as string;
  const quality = Number(formData.get("quality") ?? 0) || null;
  if (!started_at || !ended_at) return;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("sleep_logs").insert({
    user_id: user.id,
    started_at: new Date(started_at).toISOString(),
    ended_at: new Date(ended_at).toISOString(),
    quality,
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath("/wellness");
}

export async function logDailyWellnessAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("daily_wellness").upsert({
    user_id: user.id,
    log_date: new Date().toISOString().slice(0, 10),
    mood: Number(formData.get("mood") ?? 0) || null,
    stress: Number(formData.get("stress") ?? 0) || null,
    energy: Number(formData.get("energy") ?? 0) || null,
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath("/wellness");
}
