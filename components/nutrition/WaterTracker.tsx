"use client";

import { Droplet } from "lucide-react";
import { logWaterAction } from "@/lib/actions/nutrition";
import { Button } from "@/components/ui/button";

const PRESETS = [250, 500, 750];

export function WaterTracker({ totalMl, targetMl = 2500 }: { totalMl: number; targetMl?: number }) {
  const pct = Math.min(100, Math.round((totalMl / targetMl) * 100));
  return (
    <div className="bg-card rounded-md border p-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Droplet className="text-primary size-4" />
          <span className="font-medium">{totalMl} / {targetMl} ml</span>
        </div>
        <span className="text-muted-foreground text-xs">{pct}%</span>
      </div>
      <div className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full">
        <div className="bg-primary h-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((ml) => (
          <form key={ml} action={logWaterAction}>
            <input type="hidden" name="amount_ml" value={ml} />
            <Button type="submit" size="sm" variant="outline">
              +{ml} ml
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}
