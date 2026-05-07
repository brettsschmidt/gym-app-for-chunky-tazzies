"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRESETS = [60, 90, 120, 180];

export function RestTimer({ defaultSeconds = 90 }: { defaultSeconds?: number }) {
  const [target, setTarget] = useState(defaultSeconds);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const remaining = Math.max(0, target - elapsed);
  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");

  return (
    <div className="bg-card flex items-center gap-3 rounded-md border p-2">
      <div className="font-mono text-2xl tabular-nums">
        {mm}:{ss}
      </div>
      <div className="flex flex-1 flex-wrap gap-1">
        {PRESETS.map((p) => (
          <Button
            key={p}
            type="button"
            size="sm"
            variant={p === target ? "default" : "outline"}
            onClick={() => {
              setTarget(p);
              setElapsed(0);
            }}
          >
            {p}s
          </Button>
        ))}
      </div>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => setRunning((r) => !r)}
        aria-label={running ? "Pause" : "Start"}
      >
        {running ? <Pause className="size-4" /> : <Play className="size-4" />}
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={() => {
          setElapsed(0);
          setRunning(false);
        }}
        aria-label="Reset"
      >
        <RotateCcw className="size-4" />
      </Button>
    </div>
  );
}
