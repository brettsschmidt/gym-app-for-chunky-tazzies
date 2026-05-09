"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { flashMascot } from "@/lib/mascot/flash";

const logSchema = z.object({
  count: z.coerce.number().int().min(1).max(100).default(1),
  notes: z.string().max(280).optional(),
});

export async function logHotDogAction(formData: FormData) {
  const parsed = logSchema.safeParse({
    count: formData.get("count") ?? 1,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { ok: false as const, error: "invalid_input" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) {
    return { ok: false as const, error: "no_active_tazzle" };
  }

  const { error } = await supabase.from("hot_dog_logs").insert({
    user_id: user.id,
    chunky_tazzle_id: tazzleId,
    count: parsed.data.count,
    notes: parsed.data.notes ?? null,
  });
  if (error) {
    return { ok: false as const, error: "insert_failed" };
  }

  await flashMascot("hotdog");
  revalidatePath("/hotdogs");
  revalidatePath("/dashboard");
  return { ok: true as const, count: parsed.data.count };
}
