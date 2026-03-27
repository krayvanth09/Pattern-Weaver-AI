interface EcoScoreGaugeProps {
  score: number;
  label: string;
  size?: "sm" | "lg";
}

export function EcoScoreGauge({ score, label, size = "lg" }: EcoScoreGaugeProps) {
  const radius = size === "lg" ? 70 : 45;
  const strokeWidth = size === "lg" ? 10 : 7;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const svgSize = (radius + strokeWidth) * 2;

  const getColor = (s: number) => {
    if (s >= 80) return "hsl(160 60% 36%)";
    if (s >= 60) return "hsl(90 50% 45%)";
    if (s >= 40) return "hsl(45 80% 55%)";
    if (s >= 20) return "hsl(15 70% 55%)";
    return "hsl(0 65% 55%)";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={svgSize} height={svgSize} className="transform -rotate-90">
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center" style={{ marginTop: size === "lg" ? "20px" : "10px" }}>
        <span className={`font-display font-bold ${size === "lg" ? "text-3xl" : "text-xl"}`}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
