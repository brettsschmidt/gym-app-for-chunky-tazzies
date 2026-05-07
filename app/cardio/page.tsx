import { redirect } from "next/navigation";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logCardioAction } from "@/lib/actions/wellness";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CardioPage() {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: list } = await supabase
    .from("cardio_sessions")
    .select("id, mode, duration_s, distance_m, avg_hr, started_at")
    .eq("chunky_tazzle_id", tazzleId)
    .order("started_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Cardio</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log cardio</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={logCardioAction} className="space-y-3">
            <input type="hidden" name="chunky_tazzle_id" value={tazzleId} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mode">Mode</Label>
                <select
                  id="mode"
                  name="mode"
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                  defaultValue="run"
                >
                  <option value="run">Run</option>
                  <option value="bike">Bike</option>
                  <option value="row">Row</option>
                  <option value="swim">Swim</option>
                  <option value="walk">Walk</option>
                  <option value="hike">Hike</option>
                  <option value="elliptical">Elliptical</option>
                  <option value="stairmaster">Stairmaster</option>
                  <option value="jump_rope">Jump rope</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duration_s">Duration (s)</Label>
                <Input id="duration_s" name="duration_s" type="number" min={1} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="distance_m">Distance (m)</Label>
                <Input id="distance_m" name="distance_m" type="number" min={0} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="avg_hr">Avg HR</Label>
                <Input id="avg_hr" name="avg_hr" type="number" min={0} max={250} />
              </div>
            </div>
            <Textarea name="notes" rows={2} placeholder="Notes…" />
            <Button type="submit">Log cardio</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent cardio</CardTitle>
        </CardHeader>
        <CardContent>
          {(list?.length ?? 0) === 0 ? (
            <p className="text-muted-foreground text-sm">Nothing yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {(list ?? []).map((c) => (
                <li
                  key={c.id as string}
                  className="flex items-center justify-between py-2"
                >
                  <span>
                    <strong className="capitalize">{c.mode as string}</strong>{" "}
                    {c.duration_s ? `· ${Math.round((c.duration_s as number) / 60)} min` : ""}
                    {c.distance_m
                      ? ` · ${((c.distance_m as number) / 1000).toFixed(2)} km`
                      : ""}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(c.started_at as string).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
