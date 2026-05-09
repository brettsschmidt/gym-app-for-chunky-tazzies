import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function VolumePage() {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Last 8 weeks of materialized view rows for this user
  const sinceISO = new Date(
    Date.now() - 8 * 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data: rows } = await supabase
    .from("weekly_muscle_volume")
    .select(
      "week_start, muscle_group_id, hard_sets, total_volume_kg",
    )
    .eq("user_id", user.id)
    .eq("chunky_tazzle_id", tazzleId)
    .gte("week_start", sinceISO)
    .order("week_start", { ascending: false });

  const { data: muscles } = await supabase
    .from("muscle_groups")
    .select("id, name");
  const muscleNameById = new Map<number, string>(
    (muscles ?? []).map((m) => [m.id as number, m.name as string]),
  );

  // Group rows by week
  const byWeek = new Map<string, Array<Record<string, unknown>>>();
  for (const r of rows ?? []) {
    const w = r.week_start as string;
    (byWeek.get(w) ?? byWeek.set(w, []).get(w)!).push(r);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Weekly volume</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/metrics">← Metrics</Link>
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        Hard sets and total volume per muscle group, last 8 weeks. Refresh nightly
        via the cron job that calls{" "}
        <code className="bg-muted rounded px-1 py-0.5">
          gym.refresh_weekly_muscle_volume()
        </code>
        .
      </p>
      {byWeek.size === 0 ? (
        <p className="text-muted-foreground text-sm">
          No volume data yet — finish a session and the rollup will appear after the
          next refresh.
        </p>
      ) : (
        <div className="space-y-4">
          {[...byWeek.entries()].map(([week, list]) => (
            <Card key={week}>
              <CardHeader>
                <CardTitle className="text-base">
                  Week starting {new Date(week).toLocaleDateString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground text-xs uppercase">
                    <tr>
                      <th className="text-left">Muscle</th>
                      <th className="text-right">Hard sets</th>
                      <th className="text-right">Volume (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list
                      .slice()
                      .sort(
                        (a, b) =>
                          (b.total_volume_kg as number) - (a.total_volume_kg as number),
                      )
                      .map((r) => (
                        <tr
                          key={r.muscle_group_id as number}
                          className="border-t"
                        >
                          <td className="py-1">
                            {muscleNameById.get(r.muscle_group_id as number) ?? "?"}
                          </td>
                          <td className="text-right tabular-nums">
                            {r.hard_sets as number}
                          </td>
                          <td className="text-right tabular-nums">
                            {(r.total_volume_kg as number).toFixed(0)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
