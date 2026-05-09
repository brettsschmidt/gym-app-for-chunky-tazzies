import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import { getActiveTazzleId } from "@/lib/active-tazzle";
import { getProgram } from "@/lib/queries/programs";
import { listTemplates } from "@/lib/queries/workouts";
import {
  assignProgramSlotAction,
  deleteProgramAction,
  removeProgramSlotAction,
} from "@/lib/actions/programs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tazzleId = await getActiveTazzleId();
  if (!tazzleId) redirect("/dashboard");

  const result = await getProgram(id);
  if (!result) notFound();
  const { program, slots } = result;

  const templates = await listTemplates(tazzleId);

  const grid: Record<number, Record<number, typeof slots>> = {};
  for (let w = 1; w <= (program.weeks_count as number); w++) {
    grid[w] = {};
    for (let d = 0; d < 7; d++) grid[w][d] = [];
  }
  for (const s of slots) {
    const w = s.week_number as number;
    const d = s.day_of_week as number;
    if (grid[w]?.[d]) grid[w][d].push(s);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{program.name as string}</h1>
          <p className="text-muted-foreground text-sm">
            {program.weeks_count as number} weeks
          </p>
        </div>
        <form action={deleteProgramAction}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" variant="ghost" className="text-destructive">
            Delete program
          </Button>
        </form>
      </header>

      {templates.length === 0 && (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            Create a workout template first — programs schedule templates onto
            week/day slots.
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {Object.keys(grid).map((wStr) => {
          const w = Number(wStr);
          return (
            <Card key={w}>
              <CardHeader>
                <CardTitle>Week {w}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-7">
                {DAY_NAMES.map((day, d) => {
                  const cellSlots = grid[w][d];
                  return (
                    <div key={d} className="rounded-md border p-2">
                      <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase">
                        {day}
                      </p>
                      <ul className="space-y-1">
                        {cellSlots.map((s) => {
                          const tpl = s.workout_templates as unknown as
                            | { id: string; name: string }
                            | null;
                          return (
                            <li
                              key={s.id as string}
                              className="bg-secondary flex items-center justify-between rounded px-2 py-1 text-xs"
                            >
                              <span>{tpl?.name ?? "?"}</span>
                              <form action={removeProgramSlotAction}>
                                <input type="hidden" name="id" value={s.id as string} />
                                <input type="hidden" name="program_id" value={id} />
                                <button
                                  type="submit"
                                  className="text-muted-foreground hover:text-destructive"
                                  aria-label="Remove"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </form>
                            </li>
                          );
                        })}
                      </ul>
                      {templates.length > 0 && (
                        <form
                          action={assignProgramSlotAction}
                          className="mt-2 flex gap-1"
                        >
                          <input type="hidden" name="program_id" value={id} />
                          <input type="hidden" name="week_number" value={w} />
                          <input type="hidden" name="day_of_week" value={d} />
                          <input type="hidden" name="position" value={cellSlots.length} />
                          <select
                            name="workout_template_id"
                            className="border-input bg-background h-7 flex-1 rounded border px-1 text-xs"
                            defaultValue={templates[0].id as string}
                          >
                            {templates.map((t) => (
                              <option key={t.id as string} value={t.id as string}>
                                {t.name as string}
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="bg-primary text-primary-foreground rounded px-2 text-xs"
                          >
                            +
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
