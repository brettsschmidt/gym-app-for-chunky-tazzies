import { redirect } from "next/navigation";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { listTemplates } from "@/lib/queries/workouts";
import { getSchedule, DAY_NAMES, todayDow } from "@/lib/queries/schedule";
import { saveScheduleAction } from "@/lib/actions/schedule";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");

  const [templates, schedule, params] = await Promise.all([
    listTemplates(tazzleId),
    getSchedule(tazzleId),
    searchParams,
  ]);
  const today = todayDow();

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold">Weekly schedule</h1>
        <p className="text-muted-foreground text-sm">
          Pick which workout template runs each day. Leave a day blank for rest.
        </p>
      </header>

      {params.saved && (
        <p className="bg-success/15 text-success-foreground rounded-md p-3 text-sm">
          Schedule saved.
        </p>
      )}
      {params.error && (
        <p className="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
          Couldn&apos;t save the schedule. Try again.
        </p>
      )}

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-sm">
            <p className="text-muted-foreground">
              You don&apos;t have any templates yet.
            </p>
            <Button asChild className="mt-3">
              <a href="/workouts/new">Create a template first</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your week</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveScheduleAction} className="space-y-3">
              {DAY_NAMES.map((name, day) => {
                const current = schedule.get(day);
                const isToday = day === today;
                return (
                  <div
                    key={day}
                    className={`flex items-center gap-3 rounded-md border p-2 ${
                      isToday ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <span className="w-24 shrink-0 text-sm font-medium">
                      {name}
                      {isToday && (
                        <span className="text-primary ml-1 text-xs">today</span>
                      )}
                    </span>
                    <select
                      name={`day_${day}`}
                      defaultValue={current?.workout_template_id ?? ""}
                      className="border-input bg-background h-9 flex-1 rounded-md border px-2 text-sm"
                    >
                      <option value="">— Rest —</option>
                      {templates.map((t) => (
                        <option key={t.id as string} value={t.id as string}>
                          {t.name as string}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
              <Button type="submit" className="w-full">
                Save schedule
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
