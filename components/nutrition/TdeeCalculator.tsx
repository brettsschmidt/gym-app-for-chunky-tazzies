"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setTargetsAction } from "@/lib/actions/nutrition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  macrosForGoal,
  tdee,
  type ActivityLevel,
  type Goal,
  type Sex,
} from "@/lib/tdee";

const ACTIVITY_OPTIONS: Array<{ value: ActivityLevel; label: string }> = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light (1-3x/wk)" },
  { value: "moderate", label: "Moderate (3-5x/wk)" },
  { value: "active", label: "Active (6-7x/wk)" },
  { value: "very_active", label: "Very active (2x/day)" },
];

export function TdeeCalculator() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState(30);
  const [heightCm, setHeightCm] = useState(180);
  const [weightKg, setWeightKg] = useState(80);
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<Goal>("maintain");

  const total = useMemo(
    () => tdee({ sex, ageYears: age, heightCm, weightKg, activity }),
    [sex, age, heightCm, weightKg, activity],
  );
  const macros = useMemo(
    () => macrosForGoal({ tdee: total, weightKg, goal }),
    [total, weightKg, goal],
  );

  function applyTargets() {
    const fd = new FormData();
    fd.set("kcal_target", String(macros.kcal));
    fd.set("protein_g_target", String(macros.protein_g));
    fd.set("carbs_g_target", String(macros.carbs_g));
    fd.set("fat_g_target", String(macros.fat_g));
    fd.set("fiber_g_target", String(macros.fiber_g));
    startTransition(async () => {
      await setTargetsAction(fd);
      toast.success("Targets saved");
      router.push("/nutrition/targets");
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Sex">
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value as Sex)}
            className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
          >
            <option value="male">male</option>
            <option value="female">female</option>
          </select>
        </Field>
        <Field label="Age">
          <Input
            type="number"
            min={16}
            max={100}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
          />
        </Field>
        <Field label="Height (cm)">
          <Input
            type="number"
            min={120}
            max={230}
            value={heightCm}
            onChange={(e) => setHeightCm(Number(e.target.value))}
          />
        </Field>
        <Field label="Weight (kg)">
          <Input
            type="number"
            step={0.1}
            min={30}
            max={250}
            value={weightKg}
            onChange={(e) => setWeightKg(Number(e.target.value))}
          />
        </Field>
        <Field label="Activity">
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value as ActivityLevel)}
            className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
          >
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Goal">
          <div className="flex gap-1">
            {(["cut", "maintain", "bulk"] as Goal[]).map((g) => (
              <Button
                key={g}
                type="button"
                size="sm"
                variant={goal === g ? "default" : "outline"}
                onClick={() => setGoal(g)}
                className="flex-1 capitalize"
              >
                {g}
              </Button>
            ))}
          </div>
        </Field>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estimated needs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            TDEE: <strong>{total.toFixed(0)} kcal</strong> · Goal-adjusted:{" "}
            <strong>{macros.kcal} kcal</strong>
          </p>
          <ul className="mt-3 grid grid-cols-4 gap-3 text-sm">
            <li>
              <p className="text-muted-foreground text-xs">Protein</p>
              <p className="text-lg font-semibold">{macros.protein_g} g</p>
            </li>
            <li>
              <p className="text-muted-foreground text-xs">Carbs</p>
              <p className="text-lg font-semibold">{macros.carbs_g} g</p>
            </li>
            <li>
              <p className="text-muted-foreground text-xs">Fat</p>
              <p className="text-lg font-semibold">{macros.fat_g} g</p>
            </li>
            <li>
              <p className="text-muted-foreground text-xs">Fiber</p>
              <p className="text-lg font-semibold">{macros.fiber_g} g</p>
            </li>
          </ul>
          <Button
            type="button"
            className="mt-4 w-full"
            disabled={isPending}
            onClick={applyTargets}
          >
            Save these targets
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
