"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  STANDARD_PLATES,
  platesPerSide,
} from "@/lib/plate-calculator";

export function PlateCalculator({ initialKg }: { initialKg?: number | null }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(
    initialKg && initialKg > 0 ? initialKg : 60,
  );
  const [bar, setBar] = useState(STANDARD_PLATES.barWeightKg);

  const breakdown = useMemo(
    () => platesPerSide(target, { ...STANDARD_PLATES, barWeightKg: bar }),
    [target, bar],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Plate calculator"
          className="size-7"
        >
          <Calculator className="size-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Plate calculator</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="plate-target">Target (kg)</Label>
            <Input
              id="plate-target"
              type="number"
              step={0.5}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value || 0))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plate-bar">Bar (kg)</Label>
            <Input
              id="plate-bar"
              type="number"
              step={0.5}
              value={bar}
              onChange={(e) => setBar(Number(e.target.value || 0))}
            />
          </div>
        </div>

        <div className="bg-muted/40 mt-2 rounded-md border p-3 text-sm">
          <div className="text-muted-foreground mb-2 text-xs uppercase">
            Per side
          </div>
          {breakdown.perSide.length === 0 ? (
            <p>Just the bar.</p>
          ) : (
            <ul className="space-y-1">
              {breakdown.perSide.map((p) => (
                <li
                  key={p.plateKg}
                  className="flex items-center justify-between"
                >
                  <span>{p.plateKg} kg</span>
                  <span className="font-mono">× {p.count}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex justify-between border-t pt-2 text-xs">
            <span>Loaded total</span>
            <span className="font-mono">{breakdown.totalKg.toFixed(2)} kg</span>
          </div>
          {breakdown.remainder > 0.01 && (
            <p className="text-destructive mt-1 text-xs">
              Can't reach exactly with available plates ({breakdown.remainder.toFixed(2)} kg short).
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
