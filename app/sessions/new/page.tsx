import { redirect } from "next/navigation";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { listTemplates } from "@/lib/queries/workouts";
import { startSessionAction } from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");
  const { template } = await searchParams;
  const templates = await listTemplates(tazzleId);

  return (
    <div className="mx-auto max-w-md space-y-4 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Start a session</CardTitle>
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
              <Button type="submit" className="w-full">
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
