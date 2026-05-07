"use client";

import { useTransition } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addExerciseToSessionAction,
  deleteSetAction,
  finishSessionAction,
  upsertSetAction,
} from "@/lib/actions/sessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RestTimer } from "@/components/sessions/RestTimer";
import { totalTonnage, workingSetCount } from "@/lib/volume";

export interface SessionExerciseShape {
  id: string;
  exercise_id: string;
  exercise_name: string;
  position: number;
  sets: Array<{
    id: string;
    set_number: number;
    reps: number | null;
    weight_kg: number | null;
    rpe: number | null;
    is_warmup: boolean;
    is_completed: boolean;
  }>;
}

export function SessionLogger({
  sessionId,
  isOwner,
  isFinished,
  exercises,
  exerciseOptions,
}: {
  sessionId: string;
  isOwner: boolean;
  isFinished: boolean;
  exercises: SessionExerciseShape[];
  exerciseOptions: Array<{ id: string; name: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const sessionPath = `/sessions/${sessionId}`;

  const allSets = exercises.flatMap((e) => e.sets);
  const totalKg = totalTonnage(allSets);
  const completedSets = workingSetCount(allSets);

  function persistSet(
    set: SessionExerciseShape["sets"][number],
    sessionExerciseId: string,
    patch: Partial<SessionExerciseShape["sets"][number]>,
  ) {
    const fd = new FormData();
    fd.set("id", set.id);
    fd.set("session_exercise_id", sessionExerciseId);
    fd.set("set_number", String(set.set_number));
    const merged = { ...set, ...patch };
    if (merged.reps != null) fd.set("reps", String(merged.reps));
    if (merged.weight_kg != null) fd.set("weight_kg", String(merged.weight_kg));
    if (merged.rpe != null) fd.set("rpe", String(merged.rpe));
    fd.set("is_warmup", merged.is_warmup ? "true" : "false");
    fd.set("is_completed", merged.is_completed ? "true" : "false");
    fd.set("session_path", sessionPath);
    startTransition(async () => {
      await upsertSetAction(fd);
    });
  }

  function addExercise(exerciseId: string) {
    const fd = new FormData();
    fd.set("session_id", sessionId);
    fd.set("exercise_id", exerciseId);
    fd.set("position", String(exercises.length));
    startTransition(async () => {
      await addExerciseToSessionAction(fd);
      toast.success("Exercise added");
    });
  }

  return (
    <div className="space-y-4">
      <div className="bg-card flex items-center justify-between rounded-md border p-3 text-sm">
        <span>
          <strong>{completedSets}</strong> working sets ·{" "}
          <strong>{totalKg.toFixed(0)}</strong> kg moved
        </span>
        {!isFinished && isOwner && <RestTimer />}
      </div>

      {exercises.map((ex) => (
        <Card key={ex.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {ex.position + 1}. {ex.exercise_name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="w-10 text-left">#</th>
                  <th className="text-left">Reps</th>
                  <th className="text-left">Weight</th>
                  <th className="text-left">RPE</th>
                  <th className="w-12">W</th>
                  <th className="w-12">✓</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {ex.sets.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="text-muted-foreground py-1.5">{s.set_number}</td>
                    <td>
                      <SetNumberInput
                        value={s.reps}
                        disabled={!isOwner || isFinished}
                        onCommit={(v) => persistSet(s, ex.id, { reps: v })}
                      />
                    </td>
                    <td>
                      <SetNumberInput
                        value={s.weight_kg}
                        step={0.5}
                        disabled={!isOwner || isFinished}
                        onCommit={(v) => persistSet(s, ex.id, { weight_kg: v })}
                      />
                    </td>
                    <td>
                      <SetNumberInput
                        value={s.rpe}
                        step={0.5}
                        max={10}
                        disabled={!isOwner || isFinished}
                        onCommit={(v) => persistSet(s, ex.id, { rpe: v })}
                      />
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={s.is_warmup}
                        disabled={!isOwner || isFinished}
                        onChange={(e) =>
                          persistSet(s, ex.id, { is_warmup: e.target.checked })
                        }
                      />
                    </td>
                    <td className="text-center">
                      <Button
                        type="button"
                        size="icon"
                        variant={s.is_completed ? "default" : "outline"}
                        disabled={!isOwner || isFinished}
                        onClick={() =>
                          persistSet(s, ex.id, { is_completed: !s.is_completed })
                        }
                      >
                        <Check className="size-4" />
                      </Button>
                    </td>
                    <td className="text-right">
                      {isOwner && !isFinished && (
                        <form
                          action={async (fd) => {
                            fd.set("id", s.id);
                            fd.set("session_path", sessionPath);
                            await deleteSetAction(fd);
                          }}
                        >
                          <button
                            type="submit"
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Delete set"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {isOwner && !isFinished && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={isPending}
                onClick={() => {
                  const next = (ex.sets[ex.sets.length - 1]?.set_number ?? 0) + 1;
                  const fd = new FormData();
                  fd.set("session_exercise_id", ex.id);
                  fd.set("set_number", String(next));
                  fd.set("session_path", sessionPath);
                  startTransition(async () => {
                    await upsertSetAction(fd);
                  });
                }}
              >
                <Plus className="size-4" /> Add set
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

      {isOwner && !isFinished && exerciseOptions.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <Label className="text-xs">Add exercise to session</Label>
            <div className="mt-2 flex gap-2">
              <select
                id="add-ex"
                className="border-input bg-background h-9 flex-1 rounded-md border px-2 text-sm"
                defaultValue={exerciseOptions[0].id}
              >
                {exerciseOptions.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                onClick={() => {
                  const sel = document.getElementById("add-ex") as HTMLSelectElement;
                  if (sel) addExercise(sel.value);
                }}
              >
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isOwner && !isFinished && (
        <form action={finishSessionAction}>
          <input type="hidden" name="id" value={sessionId} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Finish up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="bodyweight_kg">Bodyweight (kg)</Label>
                  <Input
                    id="bodyweight_kg"
                    name="bodyweight_kg"
                    type="number"
                    step={0.1}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="perceived_effort">Perceived effort (1–10)</Label>
                  <Input
                    id="perceived_effort"
                    name="perceived_effort"
                    type="number"
                    min={1}
                    max={10}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>
              <Button type="submit" className="w-full">
                Finish session
              </Button>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}

function SetNumberInput({
  value,
  onCommit,
  step = 1,
  max,
  disabled,
}: {
  value: number | null;
  onCommit: (v: number | null) => void;
  step?: number;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <Input
      type="number"
      step={step}
      max={max}
      defaultValue={value ?? ""}
      disabled={disabled}
      onBlur={(e) => {
        const v = e.target.value === "" ? null : Number(e.target.value);
        onCommit(v);
      }}
      className="h-8 w-20"
    />
  );
}
