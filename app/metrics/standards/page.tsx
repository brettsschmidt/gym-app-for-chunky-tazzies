import Link from "next/link";
import { listMyPRs, listStrengthStandards } from "@/lib/queries/prs";
import {
  bodyweightBand,
  classifyLift,
  tierColor,
  tierLabel,
  type Sex,
  type StandardRow,
} from "@/lib/strength-standards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PRIMARY_LIFTS = [
  "back-squat",
  "front-squat",
  "bench-press",
  "deadlift",
  "overhead-press",
];

export default async function StandardsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let sex: Sex = "male";
  let bodyweightKg = 80;
  if (user) {
    const { data: prefs } = await supabase
      .from("user_prefs")
      .select("sex")
      .eq("user_id", user.id)
      .maybeSingle();
    if (prefs?.sex === "female") sex = "female";

    const { data: bm } = await supabase
      .from("body_metrics")
      .select("weight_kg")
      .eq("user_id", user.id)
      .order("measured_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (bm?.weight_kg) bodyweightKg = bm.weight_kg as number;
  }

  const standards = (await listStrengthStandards()) as unknown as StandardRow[];
  const prs = await listMyPRs();
  const band = bodyweightBand(bodyweightKg, sex);
  const standardFor = (slug: string) =>
    standards.find(
      (r) => r.exercise_slug === slug && r.sex === sex && r.bodyweight_band === band,
    ) ?? null;
  const prFor = (slug: string) => {
    return (prs as Array<Record<string, unknown>>).find((p) => {
      const ex = p.exercises as { slug?: string } | null;
      return ex?.slug === slug && p.kind === "1rm";
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Strength standards</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/metrics">← Metrics</Link>
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        Comparing your e1RM to common standards for {sex} · {band} kg bodyweight.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {PRIMARY_LIFTS.map((slug) => {
          const std = standardFor(slug);
          const pr = prFor(slug);
          const e1rm = (pr?.value_numeric as number | undefined) ?? 0;
          const tier = classifyLift(e1rm, std);
          const niceName = slug
            .split("-")
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(" ");
          return (
            <Card key={slug}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{niceName}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${tierColor(tier)}`}
                  >
                    {tierLabel(tier)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  Your e1RM:{" "}
                  <strong>{e1rm > 0 ? `${e1rm.toFixed(1)} kg` : "—"}</strong>
                </div>
                {std ? (
                  <ul className="text-muted-foreground grid grid-cols-5 gap-1 text-xs">
                    <li>
                      Untrained
                      <div className="text-foreground">{std.untrained}</div>
                    </li>
                    <li>
                      Novice<div className="text-foreground">{std.novice}</div>
                    </li>
                    <li>
                      Intermediate
                      <div className="text-foreground">{std.intermediate}</div>
                    </li>
                    <li>
                      Advanced
                      <div className="text-foreground">{std.advanced}</div>
                    </li>
                    <li>
                      Elite<div className="text-foreground">{std.elite}</div>
                    </li>
                  </ul>
                ) : (
                  <p className="text-muted-foreground">
                    No standard seeded for this lift / bodyweight yet.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
