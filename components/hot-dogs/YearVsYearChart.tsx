interface YearLog {
  date: string; // yyyy-mm-dd
  count: number;
}

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  return Math.floor((date.getTime() - start) / 86_400_000) + 1;
}

function buildCumulative(logs: YearLog[], year: number): number[] {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const days = isLeap ? 366 : 365;
  const out = new Array(days).fill(0);
  const dailyTotals = new Map<number, number>();
  for (const l of logs) {
    const d = new Date(l.date + "T00:00:00Z");
    if (d.getUTCFullYear() !== year) continue;
    const idx = dayOfYear(d) - 1;
    dailyTotals.set(idx, (dailyTotals.get(idx) ?? 0) + l.count);
  }
  let running = 0;
  for (let i = 0; i < days; i++) {
    running += dailyTotals.get(i) ?? 0;
    out[i] = running;
  }
  return out;
}

export function YearVsYearChart({
  thisYearLogs,
  lastYearLogs,
  thisYear,
  lastYear,
  todayDayOfYear,
  projectedTotal,
}: {
  thisYearLogs: YearLog[];
  lastYearLogs: YearLog[];
  thisYear: number;
  lastYear: number;
  todayDayOfYear: number;
  projectedTotal: number;
}) {
  const lastCumulative = buildCumulative(lastYearLogs, lastYear);
  const thisCumulative = buildCumulative(thisYearLogs, thisYear).slice(0, todayDayOfYear);
  const lastFinal = lastCumulative[lastCumulative.length - 1];
  const thisToday = thisCumulative[thisCumulative.length - 1] ?? 0;
  const yMax = Math.max(1, lastFinal, projectedTotal, thisToday);
  const totalDays = lastCumulative.length;

  const W = 700;
  const H = 240;
  const PAD_L = 36;
  const PAD_R = 16;
  const PAD_T = 16;
  const PAD_B = 28;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const xFor = (day: number) => PAD_L + ((day - 1) / (totalDays - 1)) * innerW;
  const yFor = (val: number) => PAD_T + innerH - (val / yMax) * innerH;

  const lastPath = lastCumulative
    .map((v, i) => `${i === 0 ? "M" : "L"}${xFor(i + 1).toFixed(1)},${yFor(v).toFixed(1)}`)
    .join(" ");
  const thisPath = thisCumulative
    .map((v, i) => `${i === 0 ? "M" : "L"}${xFor(i + 1).toFixed(1)},${yFor(v).toFixed(1)}`)
    .join(" ");

  // Projection: from today's cumulative to day-totalDays at projectedTotal.
  const projStart = { x: xFor(todayDayOfYear), y: yFor(thisToday) };
  const projEnd = { x: xFor(totalDays), y: yFor(projectedTotal) };

  // Month tick positions (1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335).
  const monthStarts = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
  const monthLabels = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(p * yMax));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="bg-card w-full overflow-hidden rounded-xl border"
      role="img"
      aria-label={`Cumulative hot dog consumption: ${thisYear} vs ${lastYear}`}
    >
      {/* y-grid */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={yFor(v)}
            y2={yFor(v)}
            className="stroke-border"
            strokeWidth={0.5}
            strokeDasharray="2 3"
          />
          <text
            x={PAD_L - 6}
            y={yFor(v) + 3}
            textAnchor="end"
            className="fill-muted-foreground text-[10px]"
          >
            {v}
          </text>
        </g>
      ))}

      {/* month ticks */}
      {monthStarts.map((d, i) => (
        <text
          key={i}
          x={xFor(d)}
          y={H - 8}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          {monthLabels[i]}
        </text>
      ))}

      {/* last year — faded */}
      <path
        d={lastPath}
        fill="none"
        className="stroke-muted-foreground"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.55}
      />

      {/* this year — primary */}
      <path
        d={thisPath}
        fill="none"
        className="stroke-primary"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* projection — dashed pink */}
      <line
        x1={projStart.x}
        y1={projStart.y}
        x2={projEnd.x}
        y2={projEnd.y}
        className="stroke-accent"
        strokeWidth={2}
        strokeDasharray="5 4"
        strokeLinecap="round"
      />

      {/* today marker */}
      <line
        x1={xFor(todayDayOfYear)}
        x2={xFor(todayDayOfYear)}
        y1={PAD_T}
        y2={H - PAD_B}
        className="stroke-primary"
        strokeWidth={1}
        strokeDasharray="3 3"
        opacity={0.5}
      />
      <circle
        cx={xFor(todayDayOfYear)}
        cy={yFor(thisToday)}
        r={4}
        className="fill-primary"
      />

      {/* end-of-last-year marker */}
      <circle
        cx={xFor(totalDays)}
        cy={yFor(lastFinal)}
        r={3}
        className="fill-muted-foreground"
        opacity={0.7}
      />

      {/* legend */}
      <g transform={`translate(${PAD_L + 6}, ${PAD_T + 6})`}>
        <rect width={130} height={42} className="fill-card" rx={4} />
        <line x1={6} x2={22} y1={12} y2={12} className="stroke-primary" strokeWidth={3} strokeLinecap="round" />
        <text x={28} y={15} className="fill-foreground text-[10px]">
          {thisYear} ({thisToday})
        </text>
        <line x1={6} x2={22} y1={26} y2={26} className="stroke-muted-foreground" strokeWidth={2} strokeLinecap="round" opacity={0.55} />
        <text x={28} y={29} className="fill-foreground text-[10px]">
          {lastYear} ({lastFinal})
        </text>
        <line x1={6} x2={22} y1={38} y2={38} className="stroke-accent" strokeWidth={2} strokeDasharray="3 2" strokeLinecap="round" />
        <text x={28} y={40} className="fill-foreground text-[10px]">
          projected ({projectedTotal})
        </text>
      </g>
    </svg>
  );
}
