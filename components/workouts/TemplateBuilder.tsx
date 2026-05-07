"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createTemplateAction,
  updateTemplateAction,
} from "@/lib/actions/workouts";
import type {
  ProgressionRule,
  TemplateExerciseLine,
} from "@/lib/schemas/workouts";
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

type ExerciseOption = { id: string; name: string };

export interface TemplateBuilderProps {
  mode: "create" | "edit";
  tazzleId: string;
  templateId?: string;
  initial?: {
    name: string;
    notes: string;
    lines: TemplateExerciseLine[];
  };
  exercises: ExerciseOption[];
}

const blankRule: ProgressionRule = { kind: "none" };

export function TemplateBuilder({
  mode,
  tazzleId,
  templateId,
  initial,
  exercises,
}: TemplateBuilderProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [lines, setLines] = useState<TemplateExerciseLine[]>(initial?.lines ?? []);

  function patch(idx: number, patch: Partial<TemplateExerciseLine>) {
    setLines((current) =>
      current.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    );
  }

  function addLine() {
    if (!exercises.length) {
      toast.error("Add an exercise first.");
      return;
    }
    setLines((current) => [
      ...current,
      {
        exercise_id: exercises[0].id,
        position: current.length,
        target_sets: 3,
        target_reps_min: 8,
        target_reps_max: 12,
        rest_seconds: 90,
        progression_rule: blankRule,
      },
    ]);
  }

  function removeLine(idx: number) {
    setLines((current) => current.filter((_, i) => i !== idx).map((l, i) => ({ ...l, position: i })));
  }

  function move(idx: number, dir: -1 | 1) {
    setLines((current) => {
      const next = [...current];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return current;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((l, i) => ({ ...l, position: i }));
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Give it a name.");
      return;
    }
    const payload =
      mode === "create"
        ? { chunky_tazzle_id: tazzleId, name, notes, lines }
        : { id: templateId, chunky_tazzle_id: tazzleId, name, notes, lines };
    const fd = new FormData();
    fd.set("payload", JSON.stringify(payload));
    if (mode === "create") {
      await createTemplateAction(fd);
    } else {
      await updateTemplateAction(fd);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "New template" : "Edit template"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Exercises</CardTitle>
          <Button type="button" size="sm" onClick={addLine}>
            <Plus className="size-4" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No exercises yet — add one to start.
            </p>
          )}
          {lines.map((line, idx) => (
            <LineEditor
              key={idx}
              idx={idx}
              line={line}
              onChange={(p) => patch(idx, p)}
              onRemove={() => removeLine(idx)}
              onMoveUp={() => move(idx, -1)}
              onMoveDown={() => move(idx, 1)}
              exercises={exercises}
            />
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit">
          {mode === "create" ? "Create template" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function LineEditor({
  idx,
  line,
  exercises,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  idx: number;
  line: TemplateExerciseLine;
  exercises: ExerciseOption[];
  onChange: (p: Partial<TemplateExerciseLine>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground w-6 text-xs">#{idx + 1}</span>
        <select
          value={line.exercise_id}
          onChange={(e) => onChange({ exercise_id: e.target.value })}
          className="border-input bg-background h-9 flex-1 rounded-md border px-2 text-sm"
        >
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
        <Button type="button" variant="ghost" size="icon" onClick={onMoveUp}>
          <ChevronUp className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={onMoveDown}>
          <ChevronDown className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-6">
        <NumField label="Sets" value={line.target_sets} onChange={(v) => onChange({ target_sets: v })} min={1} max={20} />
        <NumField label="Reps min" value={line.target_reps_min} onChange={(v) => onChange({ target_reps_min: v })} min={1} max={100} />
        <NumField label="Reps max" value={line.target_reps_max} onChange={(v) => onChange({ target_reps_max: v })} min={1} max={100} />
        <NumField label="Weight kg" value={line.target_weight_kg} onChange={(v) => onChange({ target_weight_kg: v })} min={0} max={2000} step={0.5} />
        <NumField label="RPE" value={line.target_rpe} onChange={(v) => onChange({ target_rpe: v })} min={0} max={10} step={0.5} />
        <NumField label="Rest s" value={line.rest_seconds} onChange={(v) => onChange({ rest_seconds: v })} min={0} max={900} step={5} />
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Superset group</Label>
          <Input
            type="number"
            min={0}
            value={line.superset_group ?? ""}
            onChange={(e) =>
              onChange({
                superset_group: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="—"
          />
        </div>
        <ProgressionPicker
          rule={line.progression_rule ?? blankRule}
          onChange={(r) => onChange({ progression_rule: r })}
        />
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        step={step ?? 1}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? undefined : Number(e.target.value))
        }
      />
    </div>
  );
}

function ProgressionPicker({
  rule,
  onChange,
}: {
  rule: ProgressionRule;
  onChange: (r: ProgressionRule) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Progression</Label>
      <div className="flex gap-2">
        <select
          value={rule.kind}
          onChange={(e) => {
            const kind = e.target.value as ProgressionRule["kind"];
            switch (kind) {
              case "none":
                return onChange({ kind: "none" });
              case "linear":
                return onChange({
                  kind: "linear",
                  weight_increment_kg: 2.5,
                  frequency: "each_session",
                });
              case "double_progression":
                return onChange({
                  kind: "double_progression",
                  rep_target: 12,
                  weight_increment_kg: 2.5,
                });
              case "percent_1rm":
                return onChange({ kind: "percent_1rm", percent: 0.75 });
            }
          }}
          className="border-input bg-background h-9 flex-1 rounded-md border px-2 text-sm"
        >
          <option value="none">None</option>
          <option value="linear">Linear</option>
          <option value="double_progression">Double progression</option>
          <option value="percent_1rm">% of 1RM</option>
        </select>
        {rule.kind === "linear" && (
          <Input
            type="number"
            step={0.5}
            min={0}
            value={rule.weight_increment_kg}
            onChange={(e) =>
              onChange({ ...rule, weight_increment_kg: Number(e.target.value) })
            }
            className="w-24"
          />
        )}
        {rule.kind === "double_progression" && (
          <Input
            type="number"
            min={1}
            value={rule.rep_target}
            onChange={(e) => onChange({ ...rule, rep_target: Number(e.target.value) })}
            className="w-24"
          />
        )}
        {rule.kind === "percent_1rm" && (
          <Input
            type="number"
            step={0.05}
            min={0.1}
            max={1.5}
            value={rule.percent}
            onChange={(e) => onChange({ ...rule, percent: Number(e.target.value) })}
            className="w-24"
          />
        )}
      </div>
    </div>
  );
}
