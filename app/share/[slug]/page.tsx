import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveShareLink } from "@/lib/queries/share";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface SharePayload {
  kind: "template" | "program" | "session" | "recipe";
  template?: { name: string; notes?: string };
  lines?: Array<{
    position: number;
    target_sets?: number | null;
    target_reps_min?: number | null;
    target_reps_max?: number | null;
    target_weight_kg?: number | null;
    rest_seconds?: number | null;
  }>;
  program?: { name: string; description?: string; weeks_count: number };
  workouts?: Array<{
    week_number: number;
    day_of_week: number;
    workout_template_id: string;
  }>;
  session?: {
    started_at: string;
    completed_at: string | null;
    notes?: string;
    bodyweight_kg?: number | null;
    perceived_effort?: number | null;
  };
  recipe?: { name: string; servings_yield: number; description?: string };
  items?: Array<{ position: number; quantity_g: number; food_id: string }>;
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const payload = (await resolveShareLink(slug)) as SharePayload | null;
  if (!payload) notFound();

  return (
    <main className="safe-top safe-bottom mx-auto max-w-2xl space-y-4 p-6">
      <header>
        <h1 className="text-muted-foreground text-xs uppercase tracking-widest">
          Shared {payload.kind}
        </h1>
      </header>

      {payload.kind === "template" && payload.template && (
        <Card>
          <CardHeader>
            <CardTitle>{payload.template.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {payload.template.notes && (
              <p className="text-muted-foreground mb-4 text-sm">
                {payload.template.notes}
              </p>
            )}
            <ol className="space-y-1 text-sm">
              {(payload.lines ?? []).map((l, idx) => (
                <li key={idx} className="bg-muted rounded-md p-2">
                  Set #{l.position + 1}: {l.target_sets ?? "?"} ×{" "}
                  {l.target_reps_min ?? "?"}–{l.target_reps_max ?? "?"} reps
                  {l.target_weight_kg ? ` @ ${l.target_weight_kg} kg` : ""}
                  {l.rest_seconds ? ` · rest ${l.rest_seconds}s` : ""}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {payload.kind === "program" && payload.program && (
        <Card>
          <CardHeader>
            <CardTitle>{payload.program.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-2 text-sm">
              {payload.program.weeks_count} weeks
            </p>
            {payload.program.description && (
              <p className="text-sm">{payload.program.description}</p>
            )}
            <p className="text-muted-foreground mt-3 text-xs">
              {(payload.workouts ?? []).length} workout slots scheduled
            </p>
          </CardContent>
        </Card>
      )}

      {payload.kind === "session" && payload.session && (
        <Card>
          <CardHeader>
            <CardTitle>Workout session</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Started {new Date(payload.session.started_at).toLocaleString()}
              {payload.session.completed_at &&
                ` · Done ${new Date(payload.session.completed_at).toLocaleString()}`}
            </p>
            {payload.session.bodyweight_kg && (
              <p>Bodyweight: {payload.session.bodyweight_kg} kg</p>
            )}
            {payload.session.notes && (
              <p className="text-muted-foreground mt-2 whitespace-pre-line">
                {payload.session.notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {payload.kind === "recipe" && payload.recipe && (
        <Card>
          <CardHeader>
            <CardTitle>{payload.recipe.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {payload.recipe.servings_yield} servings
            </p>
            {payload.recipe.description && (
              <p className="mt-2 text-sm">{payload.recipe.description}</p>
            )}
            <ul className="mt-3 list-disc pl-5 text-sm">
              {(payload.items ?? []).map((it, idx) => (
                <li key={idx}>{it.quantity_g} g · food {it.food_id.slice(0, 6)}…</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="text-muted-foreground text-center text-xs">
        Shared via Chunky Tazzies · the link can be revoked at any time.
      </p>
    </main>
  );
}
