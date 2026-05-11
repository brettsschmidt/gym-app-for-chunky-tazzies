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
import { YearVsYearChart } from "@/components/hot-dogs/YearVsYearChart";
import { TylerButton } from "@/components/hot-dogs/TylerButton";
import { buildHotDogStats, flavorMessage } from "@/lib/hotdog-stats";

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

  // Pull from start of last year so annual comparisons work too.
  const now = new Date();
  const thisYear = now.getUTCFullYear();
  const lastYear = thisYear - 1;
  const since = new Date(Date.UTC(lastYear, 0, 1));

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

  // Annual splits + projection for the current year.
  let thisYearCount = 0;
  let lastYearCount = 0;
  for (const r of rows) {
    const y = new Date(r.eaten_at).getUTCFullYear();
    if (y === thisYear) thisYearCount += r.count;
    else if (y === lastYear) lastYearCount += r.count;
  }
  const startOfYear = new Date(Date.UTC(thisYear, 0, 1));
  const dayOfYear = Math.max(
    1,
    Math.floor((now.getTime() - startOfYear.getTime()) / 86_400_000) + 1,
  );
  const isLeap =
    (thisYear % 4 === 0 && thisYear % 100 !== 0) || thisYear % 400 === 0;
  const daysInYear = isLeap ? 366 : 365;
  const projectedThisYear = Math.round(
    (thisYearCount / dayOfYear) * daysInYear,
  );
  const yoyDelta = thisYearCount - lastYearCount;
  const yoyPct =
    lastYearCount > 0 ? (yoyDelta / lastYearCount) * 100 : null;
  const aheadOfLastYear = lastYearCount > 0 && projectedThisYear > lastYearCount;

  // Per-day rollups for the year-vs-year chart (separate to avoid re-walking).
  const yearLogsMap = { this: [] as { date: string; count: number }[], last: [] as { date: string; count: number }[] };
  const yearMap = new Map<string, number>();
  const yearOf = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(r.eaten_at);
    const y = d.getUTCFullYear();
    if (y !== thisYear && y !== lastYear) continue;
    const key = d.toISOString().slice(0, 10);
    yearMap.set(key, (yearMap.get(key) ?? 0) + r.count);
    yearOf.set(key, y);
  }
  for (const [date, count] of yearMap) {
    const y = yearOf.get(date)!;
    if (y === thisYear) yearLogsMap.this.push({ date, count });
    else if (y === lastYear) yearLogsMap.last.push({ date, count });
  }

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
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">🌭 Hot dog tracker</h1>
          <p className="text-muted-foreground text-sm">
            The tazzle&apos;s definitive hot dog scoreboard.
          </p>
        </div>
        <TylerButton />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{thisYear} vs {lastYear}</CardTitle>
          <CardDescription>
            {lastYearCount === 0
              ? `nothing to beat from ${lastYear} — set the bar`
              : aheadOfLastYear
                ? `you're on pace for ${projectedThisYear} this year — that's a beatdown`
                : `pace would land you at ${projectedThisYear}; you need to grill harder`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-muted-foreground text-xs uppercase">{thisYear}</p>
              <p className="text-3xl font-bold tabular-nums">{thisYearCount}</p>
              <p className="text-muted-foreground text-xs">
                day {dayOfYear} of {daysInYear}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">YoY</p>
              <p
                className={`text-3xl font-bold tabular-nums ${
                  yoyDelta > 0
                    ? "text-success"
                    : yoyDelta < 0
                      ? "text-destructive"
                      : ""
                }`}
              >
                {yoyDelta > 0 ? "+" : ""}
                {yoyDelta}
              </p>
              <p className="text-muted-foreground text-xs">
                {yoyPct == null ? "n/a" : `${yoyPct > 0 ? "+" : ""}${yoyPct.toFixed(0)}%`}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase">{lastYear}</p>
              <p className="text-3xl font-bold tabular-nums">{lastYearCount}</p>
              <p className="text-muted-foreground text-xs">final</p>
            </div>
          </div>
          <p className="text-muted-foreground mt-3 text-center text-xs">
            🌭 Projected {thisYear} total: <strong>{projectedThisYear}</strong>
          </p>
          <div className="mt-4">
            <YearVsYearChart
              thisYearLogs={yearLogsMap.this}
              lastYearLogs={yearLogsMap.last}
              thisYear={thisYear}
              lastYear={lastYear}
              todayDayOfYear={dayOfYear}
              projectedTotal={projectedThisYear}
            />
          </div>
        </CardContent>
      </Card>

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
          <CardTitle>The vibe check</CardTitle>
          <CardDescription>{flavorMessage(total)}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {buildHotDogStats(total, rows.length).map((stat) => (
              <li
                key={stat.label}
                className="bg-muted/40 flex items-start gap-3 rounded-lg p-3"
              >
                <span className="text-2xl" aria-hidden>
                  {stat.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="truncate text-lg font-semibold tabular-nums">
                    {stat.value}
                  </p>
                  <p className="text-muted-foreground text-xs">{stat.detail}</p>
                </div>
              </li>
            ))}
          </ul>
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
