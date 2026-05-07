"use client";

import { useMemo } from "react";

export interface DayCount {
  date: string; // YYYY-MM-DD
  count: number;
}

const COLORS = [
  "fill-muted",
  "fill-emerald-200 dark:fill-emerald-900",
  "fill-emerald-400 dark:fill-emerald-700",
  "fill-emerald-500 dark:fill-emerald-500",
  "fill-emerald-700 dark:fill-emerald-300",
];

/**
 * GitHub-style year heatmap. Cells are 11x11; grid is 53 weeks × 7 days.
 */
export function CalendarHeatmap({ data }: { data: DayCount[] }) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  // Snap start to Sunday for clean columns
  start.setDate(start.getDate() - start.getDay());

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of data) m.set(d.date, d.count);
    return m;
  }, [data]);

  const cells: Array<{ x: number; y: number; key: string; count: number }> = [];
  const ms = 24 * 60 * 60 * 1000;
  for (let i = 0; i < 53 * 7; i++) {
    const d = new Date(start.getTime() + i * ms);
    if (d > today) break;
    const x = Math.floor(i / 7);
    const y = i % 7;
    const key = d.toISOString().slice(0, 10);
    cells.push({ x, y, key, count: counts.get(key) ?? 0 });
  }

  const cellSize = 11;
  const gap = 2;
  const W = 53 * (cellSize + gap);
  const H = 7 * (cellSize + gap);

  function level(c: number): number {
    if (c === 0) return 0;
    if (c === 1) return 1;
    if (c === 2) return 2;
    if (c === 3) return 3;
    return 4;
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Year of training activity"
    >
      {cells.map((c) => (
        <rect
          key={c.key}
          x={c.x * (cellSize + gap)}
          y={c.y * (cellSize + gap)}
          width={cellSize}
          height={cellSize}
          rx={2}
          className={COLORS[level(c.count)]}
        >
          <title>
            {c.key} — {c.count} session{c.count === 1 ? "" : "s"}
          </title>
        </rect>
      ))}
    </svg>
  );
}
