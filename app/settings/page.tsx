import { listMyShares } from "@/lib/queries/share";
import { revokeShareLinkAction } from "@/lib/actions/share";
import { deleteAccountAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildShareUrl } from "@/lib/share";

export default async function SettingsPage() {
  const shares = await listMyShares();
  const active = shares.filter((s) => !s.revoked_at);

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Share links</CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active links.</p>
          ) : (
            <ul className="divide-y text-sm">
              {active.map((s) => (
                <li
                  key={s.id as string}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <p className="capitalize">{s.kind as string}</p>
                    <p className="text-muted-foreground font-mono text-xs">
                      {buildShareUrl(s.slug as string)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {s.view_count as number} views
                      {s.expires_at &&
                        ` · expires ${new Date(s.expires_at as string).toLocaleDateString()}`}
                    </p>
                  </div>
                  <form action={revokeShareLinkAction}>
                    <input type="hidden" name="id" value={s.id as string} />
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

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={deleteAccountAction}>
            <Button type="submit" variant="ghost" className="text-destructive">
              Delete my account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
