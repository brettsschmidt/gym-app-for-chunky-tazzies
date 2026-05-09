import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabasePublicServerClient } from "@/lib/supabase/public-client";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { listMyTazzles } from "@/lib/queries/chunky-tazzles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HotDogChart } from "@/components/hot-dogs/HotDogChart";

export default async function HotDogsPage() {
  const tazzles = await listMyTazzles();
  if (tazzles.length === 0) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-2xl font-semibold">🌭 Hot dogs</h1>
        <p className="text-muted-foreground mt-2">
          Join a tazzle first, then start logging.
        </p>
      </div>
    );
  }

  const tazzleId = (await getActiveTazzleId()) ?? tazzles[0].id;
  const supabase = await createSupabaseServerClient();

  // Pull last 90 days of logs for both daily chart and leaderboard.
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const { data: logs } = await supabase
    .from("hot_dog_logs")
    .select("user_id, count, eaten_at")
    .eq("chunky_tazzle_id", tazzleId)
    .gte("eaten_at", since.toISOString())
    .order("eaten_at", { ascending: false });

  type Log = { user_id: string; count: number; eaten_at: string };
  const rows: Log[] = (logs ?? []) as Log[];

  // Resolve display names.
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const pub = await createSupabasePublicServerClient();
  const { data: profiles } = userIds.length
    ? await pub.from("profiles").select("id, display_name").in("id", userIds)
    : { data: [] as { id: string; display_name: string | null }[] };
  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id as string, (p.display_name as string) ?? "—"]),
  );

  const total = rows.reduce((sum, r) => sum + r.count, 0);

  // Daily totals (last 30 days) for chart.
  const dailyMap = new Map<string, number>();
  for (const r of rows) {
    const key = new Date(r.eaten_at).toISOString().slice(0, 10);
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + r.count);
  }
  const daily = Array.from(dailyMap, ([date, count]) => ({ date, count }));

  // Leaderboard.
  const perUser = new Map<string, number>();
  for (const r of rows) {
    perUser.set(r.user_id, (perUser.get(r.user_id) ?? 0) + r.count);
  }
  const leaderboard = Array.from(perUser, ([uid, count]) => ({
    uid,
    name: nameById.get(uid) ?? "—",
    count,
  })).sort((a, b) => b.count - a.count);

  const topName = leaderboard[0]?.name ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold">🌭 Hot dog tracker</h1>
        <p className="text-muted-foreground text-sm">
          The tazzle&apos;s definitive hot dog scoreboard. Last 90 days.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tazzle total</CardDescription>
            <CardTitle className="text-4xl tabular-nums">{total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">hot dogs consumed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Logs</CardDescription>
            <CardTitle className="text-4xl tabular-nums">{rows.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">eating events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Top dog</CardDescription>
            <CardTitle className="truncate text-2xl">
              {topName ?? "—"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs">
              {leaderboard[0] ? `${leaderboard[0].count} 🌭` : "no logs yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Last 30 days</CardTitle>
          <CardDescription>Daily tazzle-wide consumption</CardDescription>
        </CardHeader>
        <CardContent>
          <HotDogChart data={daily} days={30} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>Who&apos;s carrying the tazzle</CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nobody&apos;s logged a hot dog yet. Tap the 🌭 button to break the seal.
            </p>
          ) : (
            <ol className="space-y-2">
              {leaderboard.map((row, i) => (
                <li
                  key={row.uid}
                  className="bg-muted/40 flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-muted-foreground w-5 tabular-nums">
                      {i + 1}.
                    </span>
                    <span className="font-medium">{row.name}</span>
                    {i === 0 && <span aria-hidden>👑</span>}
                  </span>
                  <span className="tabular-nums">
                    {row.count} <span aria-hidden>🌭</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
