import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { getRecentSessions, lookupDisplayNames } from "@/lib/queries/sessions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RealtimeRefresher } from "@/components/realtime-refresher";

export default async function SessionsPage() {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");
  const sessions = await getRecentSessions(tazzleId, 30);
  const userIds = Array.from(new Set(sessions.map((s) => s.user_id as string)));
  const names = await lookupDisplayNames(userIds);

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
