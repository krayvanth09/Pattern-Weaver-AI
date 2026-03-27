import { EcoMetrics } from "@/lib/sustainability";
import { Droplets, Palette, Activity } from "lucide-react";

interface MetricsCardsProps {
  metrics: EcoMetrics;
  fabricUtilization: number;
  overallScore: number;
}

export function MetricsCards({ metrics, fabricUtilization, overallScore }: MetricsCardsProps) {
  const cards = [
    {
      icon: Droplets,
      label: "Ink Coverage",
      value: `${(metrics.inkCoverage * 100).toFixed(1)}%`,
      description: "Lower = less dye usage",
      good: metrics.inkCoverage < 0.5,
    },
    {
      icon: Palette,
      label: "Distinct Colors",
      value: metrics.colorCount.toString(),
      description: "Fewer colors = less chemical processing",
      good: metrics.colorCount < 40,
    },
    {
      icon: Activity,
      label: "Complexity",
      value: `${(metrics.complexity * 100).toFixed(0)}%`,
      description: "Simpler patterns reduce resource use",
      good: metrics.complexity < 0.5,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-background rounded-lg p-3 border border-border text-center"
          >
            <card.icon className={`h-4 w-4 mx-auto mb-1.5 ${card.good ? "text-primary" : "text-secondary"}`} />
            <div className="text-lg font-display font-bold text-foreground">{card.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-background rounded-lg p-4 border border-border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-display font-semibold text-foreground">Overall Sustainability</span>
          <span className="text-2xl font-display font-bold text-primary">{overallScore}</span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full gradient-eco rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${overallScore}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Eco Score: {metrics.ecoScore}</span>
          <span>Fabric Utilization: {fabricUtilization.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}
