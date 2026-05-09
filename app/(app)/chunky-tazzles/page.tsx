import Link from "next/link";
import { Plus } from "lucide-react";
import { listMyTazzles } from "@/lib/queries/chunky-tazzles";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ChunkyTazzlesPage() {
  const tazzles = await listMyTazzles();
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your tazzles</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/chunky-tazzles/join">Join</Link>
          </Button>
          <Button asChild>
            <Link href="/chunky-tazzles/new">
              <Plus className="size-4" /> New
            </Link>
          </Button>
        </div>
      </header>

      {tazzles.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No tazzles yet.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {tazzles.map((t) => (
            <li key={t.id}>
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {t.member_count} member{t.member_count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={t.role === "owner" ? "default" : "secondary"}>
                      {t.role}
                    </Badge>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/chunky-tazzles/${t.id}/members`}>Open</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
