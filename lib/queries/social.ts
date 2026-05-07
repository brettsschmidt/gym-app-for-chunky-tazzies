import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getReactions(subjectKind: string, subjectId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("reactions")
    .select("id, kind, user_id, created_at")
    .eq("subject_kind", subjectKind)
    .eq("subject_id", subjectId);
  return data ?? [];
}

export async function getComments(subjectKind: string, subjectId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("comments")
    .select("id, user_id, parent_id, body, created_at, edited_at")
    .eq("subject_kind", subjectKind)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function getTazzleLeaderboard(tazzleId: string, days = 7) {
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase.rpc("tazzle_leaderboard", {
    tazzle: tazzleId,
    since,
  });
  return (data as Array<Record<string, unknown>> | null) ?? [];
}

export async function listChallenges(tazzleId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("tazzle_challenges")
    .select("*")
    .eq("chunky_tazzle_id", tazzleId)
    .order("ends_at", { ascending: false });
  return data ?? [];
}
