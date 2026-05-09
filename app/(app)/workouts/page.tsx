import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { listTemplates } from "@/lib/queries/workouts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function WorkoutsPage() {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");
  const templates = await listTemplates(tazzleId);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Workout templates</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/workouts/schedule">Schedule</Link>
          </Button>
          <Button asChild>
            <Link href="/workouts/new">
              <Plus className="size-4" /> New
            </Link>
          </Button>
        </div>
      </header>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No templates yet.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {templates.map((t) => (
            <li key={t.id as string}>
              <Link href={`/workouts/${t.id}`}>
                <Card className="hover:border-primary transition-colors">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{t.name as string}</p>
                      <p className="text-muted-foreground text-xs">
                        Updated {new Date(t.updated_at as string).toLocaleDateString()}
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/sessions/new?template=${t.id}`}>Start</Link>
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
