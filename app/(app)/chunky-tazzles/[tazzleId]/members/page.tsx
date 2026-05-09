import { notFound } from "next/navigation";
import {
  createInviteAction,
  leaveTazzleAction,
  revokeInviteAction,
} from "@/lib/actions/chunky-tazzles";
import {
  getTazzle,
  listTazzleInvites,
  listTazzleMembers,
} from "@/lib/queries/chunky-tazzles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TazzleMembersPage({
  params,
}: {
  params: Promise<{ tazzleId: string }>;
}) {
  const { tazzleId } = await params;
  const tazzle = await getTazzle(tazzleId);
  if (!tazzle) notFound();

  const [members, invites, supabase] = await Promise.all([
    listTazzleMembers(tazzleId),
    listTazzleInvites(tazzleId),
    createSupabaseServerClient(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === tazzle.owner_id;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold">{tazzle.name as string}</h1>
        <p className="text-muted-foreground text-sm">Members &amp; invites</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">
                    {m.display_name ?? "(no name)"}
                    {m.user_id === user?.id && (
                      <span className="text-muted-foreground"> · you</span>
                    )}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Joined {new Date(m.joined_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={m.role === "owner" ? "default" : "secondary"}>
                  {m.role}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invite a buddy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={createInviteAction} className="grid gap-3 sm:grid-cols-3">
            <input type="hidden" name="chunky_tazzle_id" value={tazzleId} />
            <div className="space-y-1.5">
              <Label htmlFor="max_uses">Max uses</Label>
              <Input
                id="max_uses"
                name="max_uses"
                type="number"
                defaultValue={5}
                min={1}
                max={50}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expires_in_days">Expires in (days)</Label>
              <Input
                id="expires_in_days"
                name="expires_in_days"
                type="number"
                defaultValue={14}
                min={1}
                max={60}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Generate code
              </Button>
            </div>
          </form>

          {invites.length > 0 && (
            <ul className="divide-y rounded-md border">
              {invites.map((inv) => (
                <li
                  key={inv.id as string}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                >
                  <div>
                    <code className="bg-muted rounded px-2 py-0.5 font-mono">
                      {inv.code as string}
                    </code>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {inv.used_count as number}/{inv.max_uses as number} used
                      {inv.expires_at &&
                        ` · expires ${new Date(inv.expires_at as string).toLocaleDateString()}`}
                    </span>
                  </div>
                  <form action={revokeInviteAction}>
                    <input type="hidden" name="invite_id" value={inv.id as string} />
                    <input type="hidden" name="chunky_tazzle_id" value={tazzleId} />
                    <Button type="submit" variant="ghost" size="sm">
                      Revoke
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {!isOwner && (
        <form action={leaveTazzleAction}>
          <input type="hidden" name="chunky_tazzle_id" value={tazzleId} />
          <Button type="submit" variant="outline" className="text-destructive">
            Leave tazzle
          </Button>
        </form>
      )}
    </div>
  );
}
