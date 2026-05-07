"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FEED_SUBJECTS = [
  "workout_session",
  "nutrition_meal",
  "nutrition_recipe",
  "personal_record",
] as const;
type FeedSubject = (typeof FEED_SUBJECTS)[number];

function isFeedSubject(s: string): s is FeedSubject {
  return (FEED_SUBJECTS as readonly string[]).includes(s);
}

export async function toggleReactionAction(formData: FormData) {
  const subjectKind = formData.get("subject_kind");
  const subjectId = formData.get("subject_id");
  const kind = (formData.get("kind") as string) || "flex";
  const path = formData.get("path");
  if (
    typeof subjectKind !== "string" ||
    !isFeedSubject(subjectKind) ||
    typeof subjectId !== "string"
  )
    return;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("subject_kind", subjectKind)
    .eq("subject_id", subjectId)
    .eq("user_id", user.id)
    .eq("kind", kind)
    .maybeSingle();

  if (existing) {
    await supabase.from("reactions").delete().eq("id", existing.id as string);
  } else {
    await supabase.from("reactions").insert({
      subject_kind: subjectKind,
      subject_id: subjectId,
      kind,
      user_id: user.id,
    });
  }
  if (typeof path === "string") revalidatePath(path);
}

export async function postCommentAction(formData: FormData) {
  const subjectKind = formData.get("subject_kind");
  const subjectId = formData.get("subject_id");
  const body = (formData.get("body") as string)?.trim();
  const path = formData.get("path");
  const parentId = formData.get("parent_id");
  if (
    typeof subjectKind !== "string" ||
    !isFeedSubject(subjectKind) ||
    typeof subjectId !== "string" ||
    !body
  )
    return;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("comments").insert({
    subject_kind: subjectKind,
    subject_id: subjectId,
    user_id: user.id,
    body,
    parent_id:
      typeof parentId === "string" && parentId.length > 0 ? parentId : null,
  });
  if (typeof path === "string") revalidatePath(path);
}

export async function deleteCommentAction(formData: FormData) {
  const id = formData.get("id");
  const path = formData.get("path");
  if (typeof id !== "string") return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("comments").delete().eq("id", id);
  if (typeof path === "string") revalidatePath(path);
}

export async function createChallengeAction(formData: FormData) {
  const tazzleId = formData.get("chunky_tazzle_id");
  const name = (formData.get("name") as string)?.trim();
  const metric = (formData.get("metric") as string) ?? "volume_kg";
  const target = Number(formData.get("target") ?? 0);
  const days = Number(formData.get("days") ?? 30);
  if (typeof tazzleId !== "string" || !name || target <= 0) return;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const ends_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("tazzle_challenges").insert({
    chunky_tazzle_id: tazzleId,
    name,
    description: (formData.get("description") as string) || null,
    metric,
    target,
    ends_at,
    created_by: user.id,
  });
  revalidatePath(`/chunky-tazzles/${tazzleId}/challenges`);
}

export async function deleteChallengeAction(formData: FormData) {
  const id = formData.get("id");
  const tazzleId = formData.get("chunky_tazzle_id");
  if (typeof id !== "string") return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("tazzle_challenges").delete().eq("id", id);
  if (typeof tazzleId === "string")
    revalidatePath(`/chunky-tazzles/${tazzleId}/challenges`);
}
