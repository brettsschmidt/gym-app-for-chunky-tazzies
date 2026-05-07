import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listMyShares() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("share_links")
    .select("id, slug, kind, subject_id, expires_at, view_count, revoked_at, created_at")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function resolveShareLink(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("resolve_share_link", { slug });
  if (error) return null;
  return data;
}
