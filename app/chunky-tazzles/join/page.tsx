import { redeemInviteAction } from "@/lib/actions/chunky-tazzles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const errors: Record<string, string> = {
  invalid_input: "Code looks malformed.",
  not_found: "No tazzle matches that invite code.",
  expired: "That invite has expired.",
  exhausted: "That invite has reached its max uses.",
  unknown: "Something went wrong.",
};

export default async function JoinTazzlePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; code?: string }>;
}) {
  const { error, code } = await searchParams;
  return (
    <div className="mx-auto max-w-md space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Join a tazzle</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="bg-destructive/15 text-destructive mb-4 rounded-md p-3 text-sm">
              {errors[error] ?? errors.unknown}
            </p>
          )}
          <form action={redeemInviteAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Invite code</Label>
              <Input
                id="code"
                name="code"
                required
                defaultValue={code}
                placeholder="ABC23DEF45"
                className="uppercase tracking-widest"
              />
            </div>
            <Button type="submit" className="w-full">
              Join
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
