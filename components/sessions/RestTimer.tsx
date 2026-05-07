"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRESETS = [60, 90, 120, 180];

export function RestTimer({ defaultSeconds = 90 }: { defaultSeconds?: number }) {
  const [target, setTarget] = useState(defaultSeconds);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const finishedRef = useRef(false);
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

  // Beep + vibrate when timer hits zero (once per cycle).
  useEffect(() => {
    if (running && remaining === 0 && !finishedRef.current) {
      finishedRef.current = true;
      try {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.([200, 80, 200]);
        }
        const ctx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch {
        /* audio unavailable */
      }
      setRunning(false);
    }
    if (remaining > 0) finishedRef.current = false;
  }, [remaining, running]);

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
              finishedRef.current = false;
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
          finishedRef.current = false;
        }}
        aria-label="Reset"
      >
        <RotateCcw className="size-4" />
      </Button>
    </div>
  );
}
