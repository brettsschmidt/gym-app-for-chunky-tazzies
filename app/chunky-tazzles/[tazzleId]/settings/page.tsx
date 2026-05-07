import { notFound } from "next/navigation";
import { getTazzle } from "@/lib/queries/chunky-tazzles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TazzleSettingsPage({
  params,
}: {
  params: Promise<{ tazzleId: string }>;
}) {
  const { tazzleId } = await params;
  const tazzle = await getTazzle(tazzleId);
  if (!tazzle) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold">{tazzle.name as string}</h1>
        <p className="text-muted-foreground text-sm">Settings</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[8rem_1fr] gap-2 text-sm">
            <dt className="text-muted-foreground">Timezone</dt>
            <dd>{(tazzle.timezone as string) ?? "UTC"}</dd>
            <dt className="text-muted-foreground">Theme</dt>
            <dd>{(tazzle.theme as string) ?? "iron"}</dd>
            <dt className="text-muted-foreground">Created</dt>
            <dd>{new Date(tazzle.created_at as string).toLocaleString()}</dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
