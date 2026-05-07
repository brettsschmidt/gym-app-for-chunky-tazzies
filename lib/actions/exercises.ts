"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { exerciseInputSchema } from "@/lib/schemas/exercises";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function createExerciseAction(formData: FormData) {
  const parsed = exerciseInputSchema.safeParse({
    chunky_tazzle_id: formData.get("chunky_tazzle_id"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    instructions: formData.get("instructions") ?? "",
    video_url: formData.get("video_url") ?? "",
    primary_muscle_id: formData.get("primary_muscle_id") ?? "",
    equipment_id: formData.get("equipment_id") ?? "",
    is_unilateral: formData.get("is_unilateral") === "on",
  });
  if (!parsed.success) {
    redirect("/exercises/new?error=invalid_input");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("exercises")
    .insert({
      chunky_tazzle_id: parsed.data.chunky_tazzle_id,
      name: parsed.data.name,
      slug: slugify(parsed.data.name),
      description: parsed.data.description || null,
      instructions: parsed.data.instructions || null,
      video_url: parsed.data.video_url || null,
      primary_muscle_id: parsed.data.primary_muscle_id || null,
      equipment_id: parsed.data.equipment_id || null,
      is_unilateral: parsed.data.is_unilateral ?? false,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) {
    redirect("/exercises/new?error=create_failed");
  }

  revalidatePath("/exercises");
  redirect(`/exercises/${data.id}`);
}

export async function deleteExerciseAction(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("exercises").delete().eq("id", id);
  revalidatePath("/exercises");
  redirect("/exercises");
}
