import { GarmentType } from "@/lib/sustainability";
import { calculateFabricUtilization } from "@/lib/sustainability";

interface GarmentLayoutProps {
  garment: GarmentType;
}

const PIECE_COLORS = [
  "hsl(160 60% 36% / 0.3)",
  "hsl(200 50% 50% / 0.3)",
  "hsl(45 80% 55% / 0.3)",
  "hsl(280 50% 55% / 0.3)",
  "hsl(15 70% 55% / 0.3)",
];

export function GarmentLayout({ garment }: GarmentLayoutProps) {
  const { utilization, fabricHeight, layout } = calculateFabricUtilization(garment);
  const scale = 2.5;
  const svgWidth = garment.fabricWidth * scale;
  const svgHeight = Math.max(fabricHeight * scale, 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-display font-semibold text-foreground">Fabric Layout</h4>
        <span className="text-sm font-semibold text-primary">{utilization.toFixed(1)}% utilized</span>
      </div>
      
      <div className="bg-background rounded-lg p-3 border border-border overflow-x-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${garment.fabricWidth} ${fabricHeight}`}
          className="w-full h-auto"
        >
          {/* Fabric area */}
          <rect
            x={0} y={0}
            width={garment.fabricWidth}
            height={fabricHeight}
            fill="hsl(var(--muted))"
            stroke="hsl(var(--border))"
            strokeWidth={0.5}
            rx={1}
          />

          {/* Pattern pieces */}
          {layout.map((item, i) => (
            <g key={i}>
              <rect
                x={item.x}
                y={item.y}
                width={item.piece.width}
                height={item.piece.height}
                fill={PIECE_COLORS[i % PIECE_COLORS.length]}
                stroke="hsl(var(--primary))"
                strokeWidth={0.5}
                rx={0.5}
              />
              <text
                x={item.x + item.piece.width / 2}
                y={item.y + item.piece.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={Math.min(item.piece.width, item.piece.height) > 20 ? 4 : 3}
                fill="hsl(var(--foreground))"
                fontFamily="var(--font-display)"
              >
                {item.piece.name}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div>Fabric width: {garment.fabricWidth}cm</div>
        <div>Layout height: {fabricHeight.toFixed(0)}cm</div>
        <div>Pieces: {garment.pieces.length}</div>
        <div>Waste: {(100 - utilization).toFixed(1)}%</div>
      </div>
    </div>
  );
}
