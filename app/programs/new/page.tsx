import { redirect } from "next/navigation";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { createProgramAction } from "@/lib/actions/programs";
import { generateProgramAction } from "@/lib/actions/program-generator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-md space-y-4 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Auto-generate</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-3 text-sm">
            Spin up a starter program with sensible templates and progression
            rules. You can edit everything afterwards.
          </p>
          <form action={generateProgramAction} className="space-y-3">
            <input type="hidden" name="chunky_tazzle_id" value={tazzleId} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="goal">Goal</Label>
                <select
                  id="goal"
                  name="goal"
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                  defaultValue="general"
                >
                  <option value="strength">Strength</option>
                  <option value="hypertrophy">Hypertrophy</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="experience">Experience</Label>
                <select
                  id="experience"
                  name="experience"
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                  defaultValue="intermediate"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="days_per_week">Days / week</Label>
              <Input
                id="days_per_week"
                name="days_per_week"
                type="number"
                min={2}
                max={7}
                defaultValue={4}
              />
            </div>
            <Button type="submit" variant="outline" className="w-full">
              Generate program
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Or build manually</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="bg-destructive/15 text-destructive mb-4 rounded-md p-3 text-sm">
              Couldn't create — check the inputs.
            </p>
          )}
          <form action={createProgramAction} className="space-y-4">
            <input type="hidden" name="chunky_tazzle_id" value={tazzleId} />
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weeks_count">Weeks</Label>
              <Input
                id="weeks_count"
                name="weeks_count"
                type="number"
                min={1}
                max={52}
                defaultValue={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" maxLength={2000} />
            </div>
            <Button type="submit" className="w-full">
              Create
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
