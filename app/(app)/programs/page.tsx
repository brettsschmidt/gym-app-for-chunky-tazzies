import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { listPrograms } from "@/lib/queries/programs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ProgramsPage() {
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");
  const programs = await listPrograms(tazzleId);
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Programs</h1>
        <Button asChild>
          <Link href="/programs/new">
            <Plus className="size-4" /> New
          </Link>
        </Button>
      </header>
      {programs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No programs yet.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {programs.map((p) => (
            <li key={p.id as string}>
              <Link href={`/programs/${p.id}`}>
                <Card className="hover:border-primary transition-colors">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{p.name as string}</p>
                      <p className="text-muted-foreground text-xs">
                        {p.weeks_count as number} weeks
                      </p>
                    </div>
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
