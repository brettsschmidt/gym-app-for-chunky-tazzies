"use client";

interface Point {
  measured_at: string;
  weight_kg: number | null;
}

export function BodyweightChart({ data }: { data: Point[] }) {
  const points = data.filter((d): d is Point & { weight_kg: number } => d.weight_kg != null);
  if (points.length < 2) {
    return (
      <p className="text-muted-foreground text-sm">
        Log at least two weights to see a trend.
      </p>
    );
  }

  const w = 600;
  const h = 200;
  const pad = 32;
  const xs = points.map((p) => new Date(p.measured_at).getTime());
  const ys = points.map((p) => p.weight_kg);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xR = xMax - xMin || 1;
  const yR = yMax - yMin || 1;

  const path = points
    .map((p, i) => {
      const x = pad + ((new Date(p.measured_at).getTime() - xMin) / xR) * (w - 2 * pad);
      const y = h - pad - ((p.weight_kg - yMin) / yR) * (h - 2 * pad);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="text-primary w-full max-w-3xl">
        <line
          x1={pad}
          y1={h - pad}
          x2={w - pad}
          y2={h - pad}
          stroke="currentColor"
          strokeOpacity="0.2"
        />
        <line
          x1={pad}
          y1={pad}
          x2={pad}
          y2={h - pad}
          stroke="currentColor"
          strokeOpacity="0.2"
        />
        <path d={path} stroke="currentColor" strokeWidth="2" fill="none" />
        {points.map((p, i) => {
          const x = pad + ((new Date(p.measured_at).getTime() - xMin) / xR) * (w - 2 * pad);
          const y = h - pad - ((p.weight_kg - yMin) / yR) * (h - 2 * pad);
          return <circle key={i} cx={x} cy={y} r={3} fill="currentColor" />;
        })}
        <text x={pad} y={pad - 6} fontSize="11" fill="currentColor" fillOpacity="0.6">
          {yMax.toFixed(1)} kg
        </text>
        <text x={pad} y={h - pad + 14} fontSize="11" fill="currentColor" fillOpacity="0.6">
          {yMin.toFixed(1)} kg
        </text>
      </svg>
    </div>
  );
}
