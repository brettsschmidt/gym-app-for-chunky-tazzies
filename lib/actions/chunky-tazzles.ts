"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { customAlphabet } from "nanoid";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { setActiveTazzleId, clearActiveTazzleId } from "@/lib/active-tazzle";
import {
  createTazzleSchema,
  createInviteSchema,
  redeemInviteSchema,
} from "@/lib/schemas/chunky-tazzles";

const inviteCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);

export async function createTazzleAction(formData: FormData) {
  const parsed = createTazzleSchema.safeParse({
    name: formData.get("name"),
    timezone: formData.get("timezone") || undefined,
  });
  if (!parsed.success) {
    redirect("/chunky-tazzles/new?error=invalid_input");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("chunky_tazzles")
    .insert({
      name: parsed.data.name,
      owner_id: user.id,
      timezone: parsed.data.timezone ?? "UTC",
    })
    .select("id")
    .single();
  if (error || !data) {
    redirect("/chunky-tazzles/new?error=create_failed");
  }

  await setActiveTazzleId(data.id as string);
  revalidatePath("/chunky-tazzles");
  redirect(`/chunky-tazzles/${data.id}/members`);
}

export async function createInviteAction(formData: FormData) {
  const parsed = createInviteSchema.safeParse({
    chunky_tazzle_id: formData.get("chunky_tazzle_id"),
    max_uses: formData.get("max_uses") ?? 5,
    expires_in_days: formData.get("expires_in_days") || undefined,
  });
  if (!parsed.success) {
    redirect("/chunky-tazzles?error=invalid_input");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const expiresAt = parsed.data.expires_in_days
    ? new Date(Date.now() + parsed.data.expires_in_days * 86_400_000).toISOString()
    : null;

  const { error } = await supabase.from("chunky_tazzle_invites").insert({
    chunky_tazzle_id: parsed.data.chunky_tazzle_id,
    code: inviteCode(),
    created_by: user.id,
    max_uses: parsed.data.max_uses,
    expires_at: expiresAt,
  });
  if (error) {
    redirect(`/chunky-tazzles/${parsed.data.chunky_tazzle_id}/members?error=invite_failed`);
  }
  revalidatePath(`/chunky-tazzles/${parsed.data.chunky_tazzle_id}/members`);
}

export async function revokeInviteAction(formData: FormData) {
  const id = formData.get("invite_id");
  const tazzleId = formData.get("chunky_tazzle_id");
  if (typeof id !== "string" || typeof tazzleId !== "string") return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("chunky_tazzle_invites").delete().eq("id", id);
  revalidatePath(`/chunky-tazzles/${tazzleId}/members`);
}

export async function redeemInviteAction(formData: FormData) {
  const parsed = redeemInviteSchema.safeParse({
    code: formData.get("code"),
  });
  if (!parsed.success) {
    redirect("/chunky-tazzles/join?error=invalid_input");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("redeem_invite", {
    code: parsed.data.code.toUpperCase(),
  });
  if (error) {
    const msg = error.message.includes("not_found")
      ? "not_found"
      : error.message.includes("expired")
        ? "expired"
        : error.message.includes("exhausted")
          ? "exhausted"
          : "unknown";
    redirect(`/chunky-tazzles/join?error=${msg}`);
  }
  if (data) await setActiveTazzleId(data as string);
  redirect("/dashboard");
}

export async function leaveTazzleAction(formData: FormData) {
  const tazzleId = formData.get("chunky_tazzle_id");
  if (typeof tazzleId !== "string") return;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("chunky_tazzle_members")
    .delete()
    .eq("chunky_tazzle_id", tazzleId)
    .eq("user_id", user.id);
  await clearActiveTazzleId();
  revalidatePath("/chunky-tazzles");
  redirect("/chunky-tazzles");
}

export async function setActiveTazzleAction(formData: FormData) {
  const id = formData.get("chunky_tazzle_id");
  if (typeof id === "string") {
    await setActiveTazzleId(id);
  }
  revalidatePath("/", "layout");
}
