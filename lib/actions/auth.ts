"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import { signInSchema, signUpSchema, resetSchema } from "@/lib/schemas/auth";

function errCode(msg: string | undefined | null): string {
  const m = (msg ?? "").toLowerCase();
  if (m.includes("rate")) return "rate_limited";
  if (m.includes("invalid login")) return "invalid_credentials";
  if (m.includes("email not confirmed")) return "email_not_confirmed";
  if (m.includes("password")) return "weak_password";
  if (m.includes("already registered") || m.includes("already exists"))
    return "email_taken";
  return "unknown";
}

export async function signInAction(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect(`/login?error=invalid_input`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    redirect(`/login?error=${errCode(error.message)}`);
  }

  const next = (formData.get("next") as string | null) || "/dashboard";
  redirect(next);
}

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    redirect(`/signup?error=invalid_input`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName } },
  });
  if (error) {
    redirect(`/signup?error=${errCode(error.message)}`);
  }

  // If a user is immediately created (email confirmation off), seed the profile name.
  if (data.user) {
    const admin = await createSupabaseServiceRoleClient();
    await admin
      .schema("public")
      .from("profiles")
      .upsert({ id: data.user.id, display_name: parsed.data.displayName });
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = resetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    redirect(`/reset?error=invalid_input`);
  }

  const supabase = await createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/login?reset=1`,
  });
  if (error) {
    redirect(`/reset?error=${errCode(error.message)}`);
  }
  redirect("/reset?sent=1");
}

export async function deleteAccountAction() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = await createSupabaseServiceRoleClient();
  await admin.auth.admin.deleteUser(user.id);
  await supabase.auth.signOut();
  redirect("/");
}
