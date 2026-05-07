import { redirect } from "next/navigation";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { createProgramAction } from "@/lib/actions/programs";
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
    <div className="mx-auto max-w-md p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>New program</CardTitle>
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
