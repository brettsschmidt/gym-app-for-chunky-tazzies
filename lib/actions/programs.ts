"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createProgramSchema,
  programWorkoutSchema,
} from "@/lib/schemas/programs";

export async function createProgramAction(formData: FormData) {
  const parsed = createProgramSchema.safeParse({
    chunky_tazzle_id: formData.get("chunky_tazzle_id"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    weeks_count: formData.get("weeks_count") ?? 4,
  });
  if (!parsed.success) {
    redirect("/programs/new?error=invalid_input");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("programs")
    .insert({
      chunky_tazzle_id: parsed.data.chunky_tazzle_id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      weeks_count: parsed.data.weeks_count,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) {
    redirect("/programs/new?error=create_failed");
  }
  revalidatePath("/programs");
  redirect(`/programs/${data.id}`);
}

export async function assignProgramSlotAction(formData: FormData) {
  const parsed = programWorkoutSchema.safeParse({
    program_id: formData.get("program_id"),
    week_number: formData.get("week_number"),
    day_of_week: formData.get("day_of_week"),
    workout_template_id: formData.get("workout_template_id"),
    position: formData.get("position") ?? 0,
  });
  if (!parsed.success) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("program_workouts").insert({
    program_id: parsed.data.program_id,
    week_number: parsed.data.week_number,
    day_of_week: parsed.data.day_of_week,
    workout_template_id: parsed.data.workout_template_id,
    position: parsed.data.position,
  });
  revalidatePath(`/programs/${parsed.data.program_id}`);
}

export async function removeProgramSlotAction(formData: FormData) {
  const id = formData.get("id");
  const programId = formData.get("program_id");
  if (typeof id !== "string" || typeof programId !== "string") return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("program_workouts").delete().eq("id", id);
  revalidatePath(`/programs/${programId}`);
}

export async function deleteProgramAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("programs").delete().eq("id", id);
  revalidatePath("/programs");
  redirect("/programs");
}
