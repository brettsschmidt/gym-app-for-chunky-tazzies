import Link from "next/link";
import { Plus } from "lucide-react";
import { listBodyMetrics } from "@/lib/queries/metrics";
import { listMyPRs } from "@/lib/queries/prs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BodyweightChart } from "@/components/metrics/BodyweightChart";

export default async function MetricsPage() {
  const [body, prs] = await Promise.all([listBodyMetrics(), listMyPRs()]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Metrics &amp; PRs</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/metrics/standards">Standards</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/metrics/volume">Volume</Link>
          </Button>
          <Button asChild>
            <Link href="/metrics/new">
              <Plus className="size-4" /> Log
            </Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Bodyweight</CardTitle>
        </CardHeader>
        <CardContent>
          <BodyweightChart
            data={body.map((b) => ({
              measured_at: b.measured_at as string,
              weight_kg: (b.weight_kg as number | null) ?? null,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal records</CardTitle>
        </CardHeader>
        <CardContent>
          {prs.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Finish a session — PRs will land here automatically.
            </p>
          ) : (
            <ul className="divide-y text-sm">
              {prs.map((pr) => {
                const ex = pr.exercises as unknown as { name: string } | null;
                const value = pr.value_numeric as number;
                const sec = pr.value_secondary as number | null;
                const kind = pr.kind as string;
                return (
                  <li
                    key={`${pr.exercise_id}-${pr.kind}`}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <p className="font-medium">{ex?.name ?? "?"}</p>
                      <p className="text-muted-foreground text-xs">
                        {kind === "1rm"
                          ? `${value.toFixed(1)} kg est. 1RM`
                          : kind === "reps_at_weight"
                            ? `${value} reps @ ${sec ?? 0} kg`
                            : `${value} ${kind}`}
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {new Date(pr.achieved_at as string).toLocaleDateString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
