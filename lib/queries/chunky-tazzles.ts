import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabasePublicServerClient } from "@/lib/supabase/public-client";

export interface TazzleSummary {
  id: string;
  name: string;
  owner_id: string;
  member_count: number;
  role: "owner" | "member";
}

export async function listMyTazzles(): Promise<TazzleSummary[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from("chunky_tazzle_members")
    .select("chunky_tazzle_id, role, chunky_tazzles(id,name,owner_id)")
    .eq("user_id", user.id);
  if (!memberships) return [];

  // Count members per tazzle in a single round-trip
  const ids = memberships.map((m) => m.chunky_tazzle_id as string);
  let counts: Record<string, number> = {};
  if (ids.length) {
    const { data: rows } = await supabase
      .from("chunky_tazzle_members")
      .select("chunky_tazzle_id")
      .in("chunky_tazzle_id", ids);
    counts = (rows ?? []).reduce<Record<string, number>>((acc, r) => {
      const id = r.chunky_tazzle_id as string;
      acc[id] = (acc[id] ?? 0) + 1;
      return acc;
    }, {});
  }

  return memberships
    .map((m): TazzleSummary | null => {
      const tazzle = m.chunky_tazzles as unknown as
        | { id: string; name: string; owner_id: string }
        | null;
      if (!tazzle) return null;
      return {
        id: tazzle.id,
        name: tazzle.name,
        owner_id: tazzle.owner_id,
        role: m.role as "owner" | "member",
        member_count: counts[tazzle.id] ?? 1,
      };
    })
    .filter((t): t is TazzleSummary => t !== null);
}

export async function getTazzle(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("chunky_tazzles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export interface MemberRow {
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  display_name: string | null;
}

export async function listTazzleMembers(tazzleId: string): Promise<MemberRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data: members } = await supabase
    .from("chunky_tazzle_members")
    .select("user_id, role, joined_at")
    .eq("chunky_tazzle_id", tazzleId)
    .order("joined_at", { ascending: true });

  if (!members?.length) return [];

  const ids = members.map((m) => m.user_id as string);
  const pub = await createSupabasePublicServerClient();
  const { data: profiles } = await pub
    .from("profiles")
    .select("id, display_name")
    .in("id", ids);
  const byId = new Map<string, string | null>(
    (profiles ?? []).map((p) => [p.id as string, (p.display_name as string) ?? null]),
  );

  return members.map((m) => ({
    user_id: m.user_id as string,
    role: m.role as "owner" | "member",
    joined_at: m.joined_at as string,
    display_name: byId.get(m.user_id as string) ?? null,
  }));
}

export async function listTazzleInvites(tazzleId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("chunky_tazzle_invites")
    .select("id, code, expires_at, max_uses, used_count, created_at")
    .eq("chunky_tazzle_id", tazzleId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
