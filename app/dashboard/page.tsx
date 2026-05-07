import Link from "next/link";
import { Activity, Dumbbell, Salad, Users } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listMyTazzles } from "@/lib/queries/chunky-tazzles";

export default async function DashboardPage() {
  const tazzles = await listMyTazzles();
  if (tazzles.length === 0) {
    return <EmptyTazzles />;
  }

  const tazzleId = (await getActiveTazzleId()) ?? tazzles[0].id;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: recent } = await supabase
    .from("workout_sessions")
    .select("id, started_at, completed_at, user_id, workout_template_id")
    .eq("chunky_tazzle_id", tazzleId)
    .order("started_at", { ascending: false })
    .limit(5);

  const { data: templates } = await supabase
    .from("workout_templates")
    .select("id, name")
    .eq("chunky_tazzle_id", tazzleId)
    .order("updated_at", { ascending: false })
    .limit(3);

  let streak = 0;
  if (user) {
    const { data: streakRow } = await supabase.rpc("workout_streak", {
      uid: user.id,
    });
    streak = (streakRow as number | null) ?? 0;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hey there 💪</h1>
          {streak > 0 && (
            <p className="text-muted-foreground text-sm">
              🔥 {streak}-day workout streak
            </p>
          )}
        </div>
        <Button asChild>
          <Link href="/sessions/new">Start a session</Link>
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction href="/sessions/new" icon={<Dumbbell className="size-5" />} label="Log workout" />
        <QuickAction href="/nutrition/log" icon={<Salad className="size-5" />} label="Log meal" />
        <QuickAction href="/workouts/new" icon={<Activity className="size-5" />} label="New template" />
        <QuickAction href="/chunky-tazzles" icon={<Users className="size-5" />} label="Manage tazzles" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent sessions</CardTitle>
            <CardDescription>You and your tazzle</CardDescription>
          </CardHeader>
          <CardContent>
            {recent && recent.length > 0 ? (
              <ul className="divide-y">
                {recent.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                    <span>
                      {new Date(s.started_at as string).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                      {s.user_id === user?.id ? " · you" : " · buddy"}
                    </span>
                    <Link
                      href={`/sessions/${s.id}`}
                      className="text-primary text-xs hover:underline"
                    >
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No sessions yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your templates</CardTitle>
            <CardDescription>Quick start</CardDescription>
          </CardHeader>
          <CardContent>
            {templates && templates.length > 0 ? (
              <ul className="space-y-2">
                {templates.map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm">
                    <span>{t.name as string}</span>
                    <Link
                      href={`/sessions/new?template=${t.id}`}
                      className="text-primary text-xs hover:underline"
                    >
                      Start
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href="/workouts/new">Create a template</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="bg-card hover:border-primary flex items-center gap-3 rounded-xl border p-4 transition-colors"
    >
      <span className="bg-primary/10 text-primary rounded-md p-2">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

function EmptyTazzles() {
  return (
    <div className="mx-auto max-w-md space-y-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Welcome 👋</h1>
      <p className="text-muted-foreground">
        Create your first chunky tazzle (your gym-buddy crew) to start logging
        workouts and meals.
      </p>
      <div className="flex flex-col gap-2">
        <Button asChild>
          <Link href="/chunky-tazzles/new">Create a tazzle</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/chunky-tazzles/join">Join with a code</Link>
        </Button>
      </div>
    </div>
  );
}
