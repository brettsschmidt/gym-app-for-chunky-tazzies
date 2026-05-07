"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createRecipeAction,
  logMealAction,
} from "@/lib/actions/nutrition";
import { macrosForQuantity, sumMacros } from "@/lib/nutrition";
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
import { BarcodeScanner } from "@/components/nutrition/BarcodeScanner";

export interface FoodOption {
  id: string;
  name: string;
  brand: string | null;
  serving_size_g: number;
  serving_label: string | null;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
}

interface Item {
  food_id: string;
  quantity_g: number;
}

const MEAL_TYPES = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "preworkout",
  "postworkout",
] as const;

interface BaseProps {
  tazzleId: string;
  foods: FoodOption[];
}

export function MealEditor({ tazzleId, foods }: BaseProps) {
  return (
    <Editor
      tazzleId={tazzleId}
      foods={foods}
      mode="meal"
      submit={async (state) => {
        const fd = new FormData();
        fd.set(
          "payload",
          JSON.stringify({
            chunky_tazzle_id: tazzleId,
            eaten_at: state.when || undefined,
            meal_type: state.mealType,
            notes: state.notes || undefined,
            items: state.items,
          }),
        );
        await logMealAction(fd);
      }}
    />
  );
}

export function RecipeEditor({ tazzleId, foods }: BaseProps) {
  return (
    <Editor
      tazzleId={tazzleId}
      foods={foods}
      mode="recipe"
      submit={async (state) => {
        const fd = new FormData();
        fd.set(
          "payload",
          JSON.stringify({
            chunky_tazzle_id: tazzleId,
            name: state.name,
            description: state.notes || undefined,
            servings_yield: state.servings,
            items: state.items,
          }),
        );
        await createRecipeAction(fd);
      }}
    />
  );
}

interface EditorState {
  name: string;
  mealType: (typeof MEAL_TYPES)[number];
  when: string;
  notes: string;
  servings: number;
  items: Item[];
}

function Editor({
  tazzleId,
  foods,
  mode,
  submit,
}: BaseProps & {
  mode: "meal" | "recipe";
  submit: (state: EditorState) => Promise<void>;
}) {
  const [state, setState] = useState<EditorState>({
    name: "",
    mealType: "snack",
    when: "",
    notes: "",
    servings: 1,
    items: [],
  });
  const [pickerFoodId, setPickerFoodId] = useState(foods[0]?.id ?? "");
  const [pickerQty, setPickerQty] = useState(100);

  const foodById = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods]);

  const totals = useMemo(() => {
    return sumMacros(
      state.items
        .map((it) => {
          const food = foodById.get(it.food_id);
          return food ? macrosForQuantity(food, it.quantity_g) : null;
        })
        .filter((m): m is NonNullable<typeof m> => m !== null),
    );
  }, [state.items, foodById]);

  function addItem() {
    if (!pickerFoodId) return;
    setState((s) => ({
      ...s,
      items: [...s.items, { food_id: pickerFoodId, quantity_g: pickerQty }],
    }));
  }

  function removeItem(idx: number) {
    setState((s) => ({ ...s, items: s.items.filter((_, i) => i !== idx) }));
  }

  function setItem(idx: number, patch: Partial<Item>) {
    setState((s) => ({
      ...s,
      items: s.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (mode === "recipe" && !state.name.trim()) {
      toast.error("Give the recipe a name.");
      return;
    }
    if (state.items.length === 0) {
      toast.error("Add at least one food.");
      return;
    }
    await submit(state);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "meal" ? "New meal" : "New recipe"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mode === "recipe" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="rname">Name</Label>
                <Input
                  id="rname"
                  required
                  value={state.name}
                  onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="servings">Servings (yield)</Label>
                <Input
                  id="servings"
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={state.servings}
                  onChange={(e) =>
                    setState((s) => ({ ...s, servings: Number(e.target.value) || 1 }))
                  }
                />
              </div>
            </>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="mealType">Meal</Label>
                <select
                  id="mealType"
                  value={state.mealType}
                  onChange={(e) =>
                    setState((s) => ({ ...s, mealType: e.target.value as EditorState["mealType"] }))
                  }
                  className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
                >
                  {MEAL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="when">When</Label>
                <Input
                  id="when"
                  type="datetime-local"
                  value={state.when}
                  onChange={(e) => setState((s) => ({ ...s, when: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">{mode === "meal" ? "Notes" : "Description"}</Label>
            <Textarea
              id="notes"
              value={state.notes}
              onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Foods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_6rem_auto]">
            <select
              value={pickerFoodId}
              onChange={(e) => setPickerFoodId(e.target.value)}
              className="border-input bg-background h-9 rounded-md border px-2 text-sm"
            >
              {foods.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                  {f.brand ? ` — ${f.brand}` : ""}
                </option>
              ))}
            </select>
            <Input
              type="number"
              value={pickerQty}
              onChange={(e) => setPickerQty(Number(e.target.value) || 0)}
              min={1}
              className="w-24"
            />
            <Button type="button" onClick={addItem}>
              <Plus className="size-4" /> Add
            </Button>
          </div>

          <BarcodeScanner tazzleId={tazzleId} />

          {state.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No foods added yet.</p>
          ) : (
            <ul className="divide-y">
              {state.items.map((it, idx) => {
                const food = foodById.get(it.food_id);
                const macros = food ? macrosForQuantity(food, it.quantity_g) : null;
                return (
                  <li key={idx} className="flex items-center gap-2 py-2 text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{food?.name ?? "?"}</p>
                      {macros && (
                        <p className="text-muted-foreground text-xs">
                          {macros.kcal.toFixed(0)} kcal · P{macros.protein_g.toFixed(0)} ·
                          C{macros.carbs_g.toFixed(0)} · F{macros.fat_g.toFixed(0)}
                        </p>
                      )}
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={it.quantity_g}
                      onChange={(e) =>
                        setItem(idx, { quantity_g: Number(e.target.value) || 0 })
                      }
                      className="h-8 w-20"
                    />
                    <span className="text-muted-foreground text-xs">g</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(idx)}
                      className="text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="bg-muted rounded-md p-3 text-sm">
            <strong>Totals:</strong> {totals.kcal.toFixed(0)} kcal · P
            {totals.protein_g.toFixed(0)} · C{totals.carbs_g.toFixed(0)} · F
            {totals.fat_g.toFixed(0)}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit">
          {mode === "meal" ? "Log meal" : "Save recipe"}
        </Button>
      </div>
    </form>
  );
}
