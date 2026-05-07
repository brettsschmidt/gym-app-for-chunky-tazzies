import Link from "next/link";
import { getTazzleLeaderboard } from "@/lib/queries/social";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ tazzleId: string }>;
}) {
  const { tazzleId } = await params;
  const rows = await getTazzleLeaderboard(tazzleId, 7);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tazzle leaderboard</h1>
        <Button asChild variant="outline" size="sm">
          <Link href={`/chunky-tazzles/${tazzleId}/settings`}>← Tazzle</Link>
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        Last 7 days, ranked by total volume moved.
      </p>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Standings</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No completed sessions in the last week.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="text-left">#</th>
                  <th className="text-left">Member</th>
                  <th className="text-right">Sessions</th>
                  <th className="text-right">Sets</th>
                  <th className="text-right">Volume</th>
                  <th className="text-right">PRs</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.user_id as string} className="border-t">
                    <td className="py-1 tabular-nums">{i + 1}</td>
                    <td className="font-medium">
                      {(r.display_name as string) || "buddy"}
                    </td>
                    <td className="text-right tabular-nums">
                      {r.session_count as number}
                    </td>
                    <td className="text-right tabular-nums">
                      {r.set_count as number}
                    </td>
                    <td className="text-right tabular-nums">
                      {(r.total_volume_kg as number).toFixed(0)} kg
                    </td>
                    <td className="text-right tabular-nums">
                      {r.pr_count as number}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
