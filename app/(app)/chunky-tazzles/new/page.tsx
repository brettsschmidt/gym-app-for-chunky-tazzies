import { createTazzleAction } from "@/lib/actions/chunky-tazzles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewTazzlePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-md space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>New chunky tazzle</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="bg-destructive/15 text-destructive mb-4 rounded-md p-3 text-sm">
              {error === "invalid_input"
                ? "Pick a name (1–80 characters)."
                : "Couldn't create it. Try again."}
            </p>
          )}
          <form action={createTazzleAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Tazzle name</Label>
              <Input
                id="name"
                name="name"
                required
                maxLength={80}
                placeholder="The chunky monkeys"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone (optional)</Label>
              <Input
                id="timezone"
                name="timezone"
                defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
              />
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
