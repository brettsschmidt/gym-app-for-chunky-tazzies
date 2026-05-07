"use client";

import { useMemo } from "react";
import { epley1RM } from "@/lib/volume";

export interface HistoryPoint {
  date: string;
  weight_kg: number;
  reps: number;
}

export function ExerciseHistoryChart({ data }: { data: HistoryPoint[] }) {
  const points = useMemo(() => {
    return data
      .map((p) => ({
        date: new Date(p.date),
        e1rm: epley1RM(p.weight_kg, p.reps),
        weight: p.weight_kg,
        reps: p.reps,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data]);

  if (points.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No completed sets logged for this exercise yet.
      </p>
    );
  }

  const maxE = Math.max(...points.map((p) => p.e1rm)) || 1;
  const minE = Math.min(...points.map((p) => p.e1rm));
  const W = 600;
  const H = 180;
  const pad = 24;
  const xScale = (i: number) =>
    pad + (i * (W - 2 * pad)) / Math.max(1, points.length - 1);
  const yScale = (e: number) => {
    const t = (e - minE) / Math.max(1, maxE - minE);
    return H - pad - t * (H - 2 * pad);
  };
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(p.e1rm)}`)
    .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="e1RM over time">
      <line
        x1={pad}
        x2={W - pad}
        y1={H - pad}
        y2={H - pad}
        className="stroke-muted-foreground/30"
        strokeWidth={1}
      />
      <line
        x1={pad}
        x2={pad}
        y1={pad}
        y2={H - pad}
        className="stroke-muted-foreground/30"
        strokeWidth={1}
      />
      <path
        d={path}
        className="stroke-primary fill-none"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={xScale(i)}
          cy={yScale(p.e1rm)}
          r={2.5}
          className="fill-primary"
        >
          <title>
            {p.date.toLocaleDateString()} · {p.weight}kg × {p.reps} ·{" "}
            {p.e1rm.toFixed(1)}kg e1RM
          </title>
        </circle>
      ))}
      <text
        x={pad}
        y={pad - 6}
        className="fill-muted-foreground"
        fontSize={10}
      >
        e1RM (kg) — peak {maxE.toFixed(1)}
      </text>
    </svg>
  );
}
