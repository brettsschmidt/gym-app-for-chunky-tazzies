import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { getRecentSessions, lookupDisplayNames } from "@/lib/queries/sessions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { CalendarHeatmap } from "@/components/sessions/CalendarHeatmap";

export default async function SessionsPage() {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");
  const sessions = await getRecentSessions(tazzleId, 30);
  const userIds = Array.from(new Set(sessions.map((s) => s.user_id as string)));
  const names = await lookupDisplayNames(userIds);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let myDayCounts: Array<{ date: string; count: number }> = [];
  if (user) {
    const sinceISO = new Date(
      Date.now() - 365 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { data: yearRows } = await supabase
      .from("workout_sessions")
      .select("started_at")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .gte("started_at", sinceISO);
    const counts = new Map<string, number>();
    for (const r of yearRows ?? []) {
      const d = new Date(r.started_at as string).toISOString().slice(0, 10);
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    myDayCounts = [...counts.entries()].map(([date, count]) => ({
      date,
      count,
    }));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <RealtimeRefresher tazzleId={tazzleId} channels={["sessions"]} />
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sessions</h1>
        <Button asChild>
          <Link href="/sessions/new">
            <Plus className="size-4" /> Start
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your year</CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarHeatmap data={myDayCounts} />
        </CardContent>
      </Card>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No sessions logged yet.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => {
            const tpl = s.workout_templates as unknown as { name: string } | null;
            const name = names.get(s.user_id as string) ?? "buddy";
            return (
              <li key={s.id as string}>
                <Link href={`/sessions/${s.id}`}>
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{tpl?.name ?? "Freestyle"}</p>
                        <p className="text-muted-foreground text-xs">
                          {name} ·{" "}
                          {new Date(s.started_at as string).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <Badge variant={s.completed_at ? "default" : "secondary"}>
                        {s.completed_at ? "done" : "in progress"}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
