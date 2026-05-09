import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  logDailyWellnessAction,
  logSleepAction,
} from "@/lib/actions/wellness";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function WellnessPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: wellness }, { data: recentSleep }] = await Promise.all([
    supabase
      .from("daily_wellness")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", today)
      .maybeSingle(),
    supabase
      .from("sleep_logs")
      .select("started_at, ended_at, quality")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Recovery &amp; wellness</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How are you today?</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={logDailyWellnessAction} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <ScaleField name="mood" label="Mood" defaultValue={(wellness?.mood as number) ?? 3} />
              <ScaleField name="stress" label="Stress" defaultValue={(wellness?.stress as number) ?? 3} />
              <ScaleField name="energy" label="Energy" defaultValue={(wellness?.energy as number) ?? 3} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-notes">Notes</Label>
              <Textarea
                id="w-notes"
                name="notes"
                rows={2}
                defaultValue={(wellness?.notes as string) ?? ""}
              />
            </div>
            <Button type="submit">Save daily check-in</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Log sleep</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={logSleepAction} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="s-start">Bedtime</Label>
                <Input id="s-start" name="started_at" type="datetime-local" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s-end">Wake</Label>
                <Input id="s-end" name="ended_at" type="datetime-local" required />
              </div>
            </div>
            <ScaleField name="quality" label="Quality" defaultValue={3} />
            <Textarea name="notes" rows={2} placeholder="Notes…" />
            <Button type="submit">Save sleep log</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent sleep</CardTitle>
        </CardHeader>
        <CardContent>
          {(recentSleep?.length ?? 0) === 0 ? (
            <p className="text-muted-foreground text-sm">Nothing logged yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {(recentSleep ?? []).map((s, i) => {
                const start = new Date(s.started_at as string);
                const end = new Date(s.ended_at as string);
                const hours = (end.getTime() - start.getTime()) / 3600000;
                return (
                  <li key={i} className="flex items-center justify-between py-2">
                    <span>
                      {start.toLocaleDateString()} ·{" "}
                      <span className="font-mono">{hours.toFixed(1)} h</span>
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Quality {s.quality ?? "—"}/5
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

function ScaleField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label} (1-5)</Label>
      <Input name={name} type="number" min={1} max={5} defaultValue={defaultValue} />
    </div>
  );
}
