import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { listTemplates } from "@/lib/queries/workouts";
import { getSchedule, DAY_NAMES, todayDow } from "@/lib/queries/schedule";
import { startSessionAction } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");
  const { template } = await searchParams;
  const [templates, schedule] = await Promise.all([
    listTemplates(tazzleId),
    getSchedule(tazzleId),
  ]);

  const today = todayDow();
  const todaysPlan = schedule.get(today);

  return (
    <div className="mx-auto max-w-md space-y-4 p-4 md:p-6">
      {todaysPlan && (
        <Card className="border-primary">
          <CardHeader>
            <CardDescription>Today&apos;s plan · {DAY_NAMES[today]}</CardDescription>
            <CardTitle>{todaysPlan.template_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={startSessionAction}>
              <input type="hidden" name="chunky_tazzle_id" value={tazzleId} />
              <input
                type="hidden"
                name="workout_template_id"
                value={todaysPlan.workout_template_id}
              />
              <Button type="submit" className="w-full" size="lg">
                Start today&apos;s workout
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {todaysPlan ? "Or pick something else" : "Start a session"}
          </CardTitle>
          {!todaysPlan && (
            <CardDescription>
              Nothing scheduled for {DAY_NAMES[today]}.{" "}
              <Link href="/workouts/schedule" className="text-primary underline">
                Plan your week
              </Link>
              .
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {templates.length > 0 ? (
            <form action={startSessionAction} className="space-y-3">
              <input type="hidden" name="chunky_tazzle_id" value={tazzleId} />
              <select
                name="workout_template_id"
                defaultValue={template ?? templates[0].id}
                className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
              >
                {templates.map((t) => (
                  <option key={t.id as string} value={t.id as string}>
                    {t.name as string}
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                className="w-full"
                variant={todaysPlan ? "outline" : "default"}
              >
                Start from template
              </Button>
            </form>
          ) : (
            <p className="text-muted-foreground text-sm">No templates yet.</p>
          )}
          <form action={startSessionAction}>
            <input type="hidden" name="chunky_tazzle_id" value={tazzleId} />
            <Button type="submit" className="w-full" variant="outline">
              Freestyle session
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
