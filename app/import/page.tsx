import { redirect } from "next/navigation";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { ImportForm } from "@/components/import/ImportForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ImportPage() {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Import history</h1>
      <Card>
        <CardHeader>
          <CardTitle>Strong app CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-3 text-sm">
            Export your Strong history (Settings → Export Data → Export
            Strong CSV) and upload the file here. Each session is parsed by
            workout name + date; exercises are matched by name to your existing
            catalog (case-insensitive). Sets that fail to match an exercise are
            attached to a freestyle session under a placeholder.
          </p>
          <ImportForm tazzleId={tazzleId} />
        </CardContent>
      </Card>
    </div>
  );
}
