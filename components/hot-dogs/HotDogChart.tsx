interface DailyPoint {
  date: string; // yyyy-mm-dd
  count: number;
}

export function HotDogChart({
  data,
  days = 30,
}: {
  data: DailyPoint[];
  days?: number;
}) {
  // Build the last N days, filling zeros where there's no data.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = data.find((p) => p.date === key);
    buckets.push({ date: key, count: found?.count ?? 0 });
  }

  const max = Math.max(1, ...buckets.map((b) => b.count));
  const W = 600;
  const H = 200;
  const PAD = 24;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const barW = innerW / buckets.length;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="bg-card w-full overflow-hidden rounded-xl border"
      role="img"
      aria-label={`Hot dogs eaten in the last ${days} days`}
    >
      {/* baseline */}
      <line
        x1={PAD}
        x2={W - PAD}
        y1={H - PAD}
        y2={H - PAD}
        className="stroke-border"
        strokeWidth={1}
      />
      {buckets.map((b, i) => {
        const h = (b.count / max) * innerH;
        const x = PAD + i * barW + 1;
        const y = H - PAD - h;
        return (
          <g key={b.date}>
            <rect
              x={x}
              y={y}
              width={Math.max(2, barW - 2)}
              height={h}
              rx={2}
              className="fill-primary"
            />
            <title>{`${b.date}: ${b.count} 🌭`}</title>
          </g>
        );
      })}
      {/* y-axis max */}
      <text
        x={W - PAD}
        y={PAD + 4}
        textAnchor="end"
        className="fill-muted-foreground text-[10px]"
      >
        {max} max
      </text>
    </svg>
  );
}
