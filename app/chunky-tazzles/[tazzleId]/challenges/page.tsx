import Link from "next/link";
import { listChallenges } from "@/lib/queries/social";
import {
  createChallengeAction,
  deleteChallengeAction,
} from "@/lib/actions/social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ChallengesPage({
  params,
}: {
  params: Promise<{ tazzleId: string }>;
}) {
  const { tazzleId } = await params;
  const list = await listChallenges(tazzleId);
  const now = Date.now();
  const active = list.filter(
    (c) => new Date(c.ends_at as string).getTime() > now,
  );
  const past = list.filter(
    (c) => new Date(c.ends_at as string).getTime() <= now,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Challenges</h1>
        <Button asChild variant="outline" size="sm">
          <Link href={`/chunky-tazzles/${tazzleId}/leaderboard`}>
            Leaderboard
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New challenge</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createChallengeAction} className="space-y-3">
            <input type="hidden" name="chunky_tazzle_id" value={tazzleId} />
            <div className="space-y-1.5">
              <Label htmlFor="ch-name">Name</Label>
              <Input id="ch-name" name="name" required maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ch-desc">Description</Label>
              <Input id="ch-desc" name="description" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ch-metric">Metric</Label>
                <select
                  id="ch-metric"
                  name="metric"
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                  defaultValue="volume_kg"
                >
                  <option value="volume_kg">Volume (kg)</option>
                  <option value="session_count">Sessions</option>
                  <option value="streak_days">Streak (days)</option>
                  <option value="pr_count">PR count</option>
                  <option value="macro_target_days">
                    Macro-target days
                  </option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ch-target">Target</Label>
                <Input
                  id="ch-target"
                  name="target"
                  type="number"
                  min={1}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ch-days">Length (days)</Label>
                <Input
                  id="ch-days"
                  name="days"
                  type="number"
                  min={1}
                  defaultValue={30}
                />
              </div>
            </div>
            <Button type="submit">Create challenge</Button>
          </form>
        </CardContent>
      </Card>

      {active.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {active.map((c) => (
                <li
                  key={c.id as string}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <p className="font-medium">{c.name as string}</p>
                    <p className="text-muted-foreground text-xs">
                      {c.metric as string} · target {c.target as number} ·
                      ends{" "}
                      {new Date(c.ends_at as string).toLocaleDateString()}
                    </p>
                  </div>
                  <form action={deleteChallengeAction}>
                    <input type="hidden" name="id" value={c.id as string} />
                    <input
                      type="hidden"
                      name="chunky_tazzle_id"
                      value={tazzleId}
                    />
                    <Button type="submit" variant="ghost" size="sm">
                      End
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-muted-foreground space-y-1 text-sm">
              {past.map((c) => (
                <li key={c.id as string}>
                  {c.name as string} —{" "}
                  {new Date(c.ends_at as string).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
