"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodyMetricSchema = z.object({
  measured_at: z.string().optional(),
  weight_kg: z.coerce.number().positive().optional(),
  body_fat_pct: z.coerce.number().min(1).max(70).optional(),
  waist_cm: z.coerce.number().positive().optional(),
  chest_cm: z.coerce.number().positive().optional(),
  arm_cm: z.coerce.number().positive().optional(),
  thigh_cm: z.coerce.number().positive().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export async function logBodyMetricAction(formData: FormData) {
  const parsed = bodyMetricSchema.safeParse({
    measured_at: formData.get("measured_at") || undefined,
    weight_kg: formData.get("weight_kg") || undefined,
    body_fat_pct: formData.get("body_fat_pct") || undefined,
    waist_cm: formData.get("waist_cm") || undefined,
    chest_cm: formData.get("chest_cm") || undefined,
    arm_cm: formData.get("arm_cm") || undefined,
    thigh_cm: formData.get("thigh_cm") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) redirect("/metrics/new?error=invalid_input");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("body_metrics").insert({
    user_id: user.id,
    measured_at: parsed.data.measured_at
      ? new Date(parsed.data.measured_at).toISOString()
      : new Date().toISOString(),
    weight_kg: parsed.data.weight_kg ?? null,
    body_fat_pct: parsed.data.body_fat_pct ?? null,
    waist_cm: parsed.data.waist_cm ?? null,
    chest_cm: parsed.data.chest_cm ?? null,
    arm_cm: parsed.data.arm_cm ?? null,
    thigh_cm: parsed.data.thigh_cm ?? null,
    notes: parsed.data.notes ?? null,
  });

  revalidatePath("/metrics");
  redirect("/metrics");
}
