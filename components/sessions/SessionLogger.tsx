"use client";

import { Fragment, useState, useTransition } from "react";
import { Check, ChevronDown, Flame, Plus, Repeat, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { showMascot } from "@/components/mascot/MascotToast";
import {
  addExerciseToSessionAction,
  deleteSetAction,
  finishSessionAction,
  insertWarmupAction,
  repeatLastSetAction,
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
import { PlateCalculator } from "@/components/sessions/PlateCalculator";
import { totalTonnage, workingSetCount } from "@/lib/volume";
import type { SetKind } from "@/lib/schemas/sessions";
import {
  type Units,
  defaultWeightStep,
  displayToKg,
  kgToDisplay,
  roundDisplay,
  unitLabel,
} from "@/lib/units";

export interface SessionExerciseShape {
  id: string;
  exercise_id: string;
  exercise_name: string;
  position: number;
  rest_seconds?: number | null;
  sets: Array<{
    id: string;
    set_number: number;
    reps: number | null;
    weight_kg: number | null;
    rpe: number | null;
    rir: number | null;
    is_warmup: boolean;
    is_completed: boolean;
    failed_at_set: boolean;
    set_kind: SetKind;
    notes: string | null;
  }>;
}

export function SessionLogger({
  sessionId,
  isOwner,
  isFinished,
  exercises,
  exerciseOptions,
  units,
}: {
  sessionId: string;
  isOwner: boolean;
  isFinished: boolean;
  exercises: SessionExerciseShape[];
  exerciseOptions: Array<{ id: string; name: string }>;
  units: Units;
}) {
  const wLabel = unitLabel(units);
  const wStep = defaultWeightStep(units);
  const [isPending, startTransition] = useTransition();
  const sessionPath = `/sessions/${sessionId}`;
  const [expandedSet, setExpandedSet] = useState<string | null>(null);

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
    if (merged.rir != null) fd.set("rir", String(merged.rir));
    fd.set("is_warmup", merged.is_warmup ? "true" : "false");
    fd.set("is_completed", merged.is_completed ? "true" : "false");
    fd.set("failed_at_set", merged.failed_at_set ? "true" : "false");
    fd.set("set_kind", merged.set_kind);
    if (merged.notes) fd.set("notes", merged.notes);
    fd.set("session_path", sessionPath);
    startTransition(async () => {
      const result = await upsertSetAction(fd);
      if (result?.prHit && result.prValue != null) {
        const prDisplay = roundDisplay(kgToDisplay(result.prValue, units))!;
        showMascot(
          "pr",
          `🏆 PR! ${result.exerciseName ?? "Lift"} · ${prDisplay} ${wLabel} e1RM`,
        );
      } else if (
        merged.is_completed &&
        !merged.is_warmup &&
        (merged.weight_kg ?? 0) > 0 &&
        Math.random() < 0.25
      ) {
        // Show a casual mascot on roughly 1-in-4 working sets so it's a
        // delight instead of a distraction.
        showMascot("set");
      }
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

  function repeatLastSet(sessionExerciseId: string) {
    const fd = new FormData();
    fd.set("session_exercise_id", sessionExerciseId);
    fd.set("session_path", sessionPath);
    startTransition(async () => {
      await repeatLastSetAction(fd);
    });
  }

  function insertWarmup(
    sessionExerciseId: string,
    workingWeightKg: number,
    workingReps: number,
  ) {
    if (!workingWeightKg || workingWeightKg < 30) {
      toast.info("Warmup ramp only suggested for working sets ≥ 30 kg");
      return;
    }
    const fd = new FormData();
    fd.set("session_exercise_id", sessionExerciseId);
    fd.set("working_weight_kg", String(workingWeightKg));
    fd.set("working_reps", String(workingReps || 8));
    fd.set("session_path", sessionPath);
    startTransition(async () => {
      await insertWarmupAction(fd);
      toast.success("Warmup ramp added");
    });
  }

  return (
    <div className="space-y-4">
      <div className="bg-card flex items-center justify-between rounded-md border p-3 text-sm">
        <span>
          <strong>{completedSets}</strong> working sets ·{" "}
          <strong>{(kgToDisplay(totalKg, units) ?? 0).toFixed(0)}</strong>{" "}
          {wLabel} moved
        </span>
        {!isFinished && isOwner && <RestTimer />}
      </div>

      {exercises.map((ex) => {
        const firstWorking = ex.sets.find(
          (s) => !s.is_warmup && s.weight_kg != null && s.weight_kg > 0,
        );
        return (
          <Card key={ex.id}>
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-base">
                {ex.position + 1}. {ex.exercise_name}
              </CardTitle>
              {isOwner && !isFinished && (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      insertWarmup(
                        ex.id,
                        firstWorking?.weight_kg ?? 0,
                        firstWorking?.reps ?? 8,
                      )
                    }
                  >
                    <Flame className="size-3.5" /> Warmup
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => repeatLastSet(ex.id)}
                  >
                    <Repeat className="size-3.5" /> Repeat last
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="w-10 text-left">#</th>
                    <th className="text-left">Reps</th>
                    <th className="text-left">Weight</th>
                    <th className="text-left">RPE</th>
                    <th className="text-left">RIR</th>
                    <th className="w-12">W</th>
                    <th className="w-12">✓</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {ex.sets.map((s) => {
                    const isExpanded = expandedSet === s.id;
                    return (
                      <Fragment key={s.id}>
                        <tr className="border-t">
                          <td className="text-muted-foreground py-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedSet(isExpanded ? null : s.id)
                              }
                              className="hover:text-foreground inline-flex items-center gap-1"
                            >
                              {s.set_number}
                              <ChevronDown
                                className={`size-3 transition ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </td>
                          <td>
                            <SetNumberInput
                              value={s.reps}
                              disabled={!isOwner || isFinished}
                              onCommit={(v) => persistSet(s, ex.id, { reps: v })}
                            />
                          </td>
                          <td>
                            <div className="flex items-center gap-0.5">
                              <SetNumberInput
                                value={roundDisplay(
                                  kgToDisplay(s.weight_kg, units),
                                )}
                                step={wStep}
                                disabled={!isOwner || isFinished}
                                onCommit={(v) =>
                                  persistSet(s, ex.id, {
                                    weight_kg:
                                      v != null ? displayToKg(v, units) : null,
                                  })
                                }
                              />
                              <PlateCalculator initialKg={s.weight_kg} />
                            </div>
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
                          <td>
                            <SetNumberInput
                              value={s.rir}
                              max={10}
                              disabled={!isOwner || isFinished}
                              onCommit={(v) => persistSet(s, ex.id, { rir: v })}
                            />
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={s.is_warmup}
                              disabled={!isOwner || isFinished}
                              onChange={(e) =>
                                persistSet(s, ex.id, {
                                  is_warmup: e.target.checked,
                                  set_kind: e.target.checked
                                    ? "warmup"
                                    : "working",
                                })
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
                                persistSet(s, ex.id, {
                                  is_completed: !s.is_completed,
                                })
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
                        {isExpanded && (
                          <tr className="bg-muted/30 border-t">
                            <td></td>
                            <td colSpan={7} className="py-2">
                              <div className="flex flex-wrap items-center gap-3 text-xs">
                                <label className="inline-flex items-center gap-1">
                                  <input
                                    type="checkbox"
                                    checked={s.failed_at_set}
                                    disabled={!isOwner || isFinished}
                                    onChange={(e) =>
                                      persistSet(s, ex.id, {
                                        failed_at_set: e.target.checked,
                                      })
                                    }
                                  />
                                  Failed
                                </label>
                                <label className="inline-flex items-center gap-1">
                                  Kind:
                                  <select
                                    value={s.set_kind}
                                    disabled={!isOwner || isFinished}
                                    onChange={(e) =>
                                      persistSet(s, ex.id, {
                                        set_kind: e.target.value as SetKind,
                                      })
                                    }
                                    className="border-input bg-background h-7 rounded border px-1"
                                  >
                                    <option value="working">working</option>
                                    <option value="warmup">warmup</option>
                                    <option value="drop">drop</option>
                                    <option value="cluster">cluster</option>
                                    <option value="rest_pause">rest-pause</option>
                                    <option value="amrap">AMRAP</option>
                                  </select>
                                </label>
                                <input
                                  type="text"
                                  defaultValue={s.notes ?? ""}
                                  placeholder="Set notes…"
                                  disabled={!isOwner || isFinished}
                                  onBlur={(e) =>
                                    persistSet(s, ex.id, {
                                      notes: e.target.value || null,
                                    })
                                  }
                                  className="border-input bg-background h-7 flex-1 rounded border px-2"
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
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
                    const next =
                      (ex.sets[ex.sets.length - 1]?.set_number ?? 0) + 1;
                    const fd = new FormData();
                    fd.set("session_exercise_id", ex.id);
                    fd.set("set_number", String(next));
                    fd.set("set_kind", "working");
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
        );
      })}

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
                  const sel = document.getElementById(
                    "add-ex",
                  ) as HTMLSelectElement;
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
                  <Label htmlFor="bodyweight_display">
                    Bodyweight ({wLabel})
                  </Label>
                  <Input
                    id="bodyweight_display"
                    name="bodyweight_display"
                    type="number"
                    step={0.1}
                  />
                  <input type="hidden" name="bodyweight_units" value={units} />
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
