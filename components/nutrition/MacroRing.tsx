interface RingProps {
  label: string;
  value: number;
  target: number;
  unit?: string;
  colorClass?: string;
}

export function MacroRing({
  label,
  value,
  target,
  unit = "g",
  colorClass = "text-primary",
}: RingProps) {
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  const radius = 32;
  const circ = 2 * Math.PI * radius;
  const dash = circ * pct;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 80 80" className="size-20">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="6"
          className="text-muted-foreground"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 40 40)"
          className={colorClass}
        />
        <text
          x="40"
          y="44"
          textAnchor="middle"
          fontSize="14"
          fontWeight="600"
          fill="currentColor"
        >
          {Math.round(value)}
        </text>
      </svg>
      <p className="text-xs font-medium">{label}</p>
      <p className="text-muted-foreground text-[11px]">
        / {Math.round(target)} {unit}
      </p>
    </div>
  );
}
