"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createShareSchema, revokeShareSchema } from "@/lib/schemas/share";
import { newSlug } from "@/lib/share";
import { getActiveTazzleId } from "@/lib/active-tazzle";

export async function createShareLinkAction(formData: FormData) {
  const parsed = createShareSchema.safeParse({
    kind: formData.get("kind"),
    subject_id: formData.get("subject_id"),
    chunky_tazzle_id: formData.get("chunky_tazzle_id") || undefined,
    expires_in_days: formData.get("expires_in_days") || undefined,
  });
  if (!parsed.success) return { error: "invalid_input" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tazzleId = parsed.data.chunky_tazzle_id ?? (await getActiveTazzleId());
  const expiresAt = parsed.data.expires_in_days
    ? new Date(Date.now() + parsed.data.expires_in_days * 86_400_000).toISOString()
    : null;

  const { data, error } = await supabase
    .from("share_links")
    .insert({
      slug: newSlug(),
      kind: parsed.data.kind,
      subject_id: parsed.data.subject_id,
      chunky_tazzle_id: tazzleId,
      created_by: user.id,
      expires_at: expiresAt,
    })
    .select("slug")
    .single();
  if (error || !data) return { error: "create_failed" };
  revalidatePath("/settings");
  return { slug: data.slug as string };
}

export async function revokeShareLinkAction(formData: FormData) {
  const parsed = revokeShareSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", parsed.data.id);
  revalidatePath("/settings");
}
