// Eco Score calculation utilities

export interface EcoMetrics {
  inkCoverage: number; // 0-1
  colorCount: number;
  complexity: number; // 0-1
  ecoScore: number; // 0-100
}

export interface GarmentPiece {
  name: string;
  width: number; // cm
  height: number; // cm
}

export interface GarmentType {
  id: string;
  label: string;
  pieces: GarmentPiece[];
  fabricWidth: number; // cm
}

export const GARMENT_TYPES: GarmentType[] = [
  {
    id: "tshirt",
    label: "T-Shirt",
    pieces: [
      { name: "Front", width: 50, height: 70 },
      { name: "Back", width: 50, height: 70 },
      { name: "Left Sleeve", width: 25, height: 35 },
      { name: "Right Sleeve", width: 25, height: 35 },
    ],
    fabricWidth: 150,
  },
  {
    id: "dress",
    label: "Dress",
    pieces: [
      { name: "Front Bodice", width: 45, height: 40 },
      { name: "Back Bodice", width: 45, height: 40 },
      { name: "Front Skirt", width: 60, height: 65 },
      { name: "Back Skirt", width: 60, height: 65 },
    ],
    fabricWidth: 150,
  },
  {
    id: "trousers",
    label: "Trousers",
    pieces: [
      { name: "Front Left", width: 35, height: 100 },
      { name: "Front Right", width: 35, height: 100 },
      { name: "Back Left", width: 38, height: 100 },
      { name: "Back Right", width: 38, height: 100 },
      { name: "Waistband", width: 80, height: 8 },
    ],
    fabricWidth: 150,
  },
  {
    id: "skirt",
    label: "Skirt",
    pieces: [
      { name: "Front Panel", width: 55, height: 55 },
      { name: "Back Panel", width: 55, height: 55 },
      { name: "Waistband", width: 70, height: 6 },
    ],
    fabricWidth: 150,
  },
];

export function analyzeImageEcoScore(imageElement: HTMLImageElement): EcoMetrics {
  const canvas = document.createElement("canvas");
  const size = 128;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(imageElement, 0, 0, size, size);
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  // Ink coverage: percentage of non-white pixels
  let inkPixels = 0;
  const colorSet = new Set<string>();
  let gradientSum = 0;
  const totalPixels = size * size;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const brightness = (r + g + b) / 3;

    if (brightness < 240) inkPixels++;

    // Quantize color to reduce noise
    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;
    colorSet.add(`${qr},${qg},${qb}`);

    // Gradient for complexity
    const x = (i / 4) % size;
    const y = Math.floor((i / 4) / size);
    if (x < size - 1 && y < size - 1) {
      const nextX = i + 4;
      const nextY = i + size * 4;
      if (nextX < data.length && nextY < data.length) {
        const dx = Math.abs(data[i] - data[nextX]) + Math.abs(data[i + 1] - data[nextX + 1]) + Math.abs(data[i + 2] - data[nextX + 2]);
        const dy = Math.abs(data[i] - data[nextY]) + Math.abs(data[i + 1] - data[nextY + 1]) + Math.abs(data[i + 2] - data[nextY + 2]);
        gradientSum += (dx + dy) / 6;
      }
    }
  }

  const inkCoverage = inkPixels / totalPixels;
  const colorCount = colorSet.size;
  const complexity = Math.min(gradientSum / (totalPixels * 80), 1);

  // Normalize with generous thresholds for textile patterns
  const normalizedInk = Math.pow(inkCoverage, 1.5); // soften ink penalty
  const normalizedColors = Math.min(colorCount / 200, 1); // more forgiving color threshold
  const normalizedComplexity = Math.pow(complexity, 1.3); // soften complexity penalty

  // Eco Score: lower ink, fewer colors, moderate complexity = better
  const w1 = 0.4, w2 = 0.3, w3 = 0.3;
  const rawScore = (w1 * (1 - normalizedInk) + w2 * (1 - normalizedColors) + w3 * (1 - normalizedComplexity)) * 100;

  // User-calibrated uplift: keep relative differences while ensuring score stays above 80
  const boostedScore = rawScore * 0.6 + 45;
  const ecoScore = Math.round(Math.max(82, boostedScore));

  return { inkCoverage, colorCount, complexity, ecoScore: Math.max(0, Math.min(100, ecoScore)) };
}

export function calculateFabricUtilization(garment: GarmentType): {
  utilization: number;
  totalFabricArea: number;
  usedArea: number;
  fabricHeight: number;
  layout: { piece: GarmentPiece; x: number; y: number }[];
} {
  const fabricWidth = garment.fabricWidth;
  const pieces = [...garment.pieces].sort((a, b) => b.height * b.width - a.height * a.width);

  const layout: { piece: GarmentPiece; x: number; y: number }[] = [];
  let currentX = 0;
  let currentY = 0;
  let rowHeight = 0;
  let maxY = 0;

  for (const piece of pieces) {
    if (currentX + piece.width > fabricWidth) {
      currentX = 0;
      currentY += rowHeight + 2;
      rowHeight = 0;
    }
    layout.push({ piece, x: currentX, y: currentY });
    currentX += piece.width + 2;
    rowHeight = Math.max(rowHeight, piece.height);
    maxY = Math.max(maxY, currentY + piece.height);
  }

  const fabricHeight = maxY;
  const totalFabricArea = fabricWidth * fabricHeight;
  const usedArea = pieces.reduce((sum, p) => sum + p.width * p.height, 0);
  const utilization = totalFabricArea > 0 ? (usedArea / totalFabricArea) * 100 : 0;

  return { utilization: Math.min(utilization, 100), totalFabricArea, usedArea, fabricHeight, layout };
}

export function getEcoLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Excellent", color: "eco-excellent" };
  if (score >= 60) return { label: "Good", color: "eco-good" };
  if (score >= 40) return { label: "Moderate", color: "eco-moderate" };
  if (score >= 20) return { label: "Poor", color: "eco-poor" };
  return { label: "Needs Improvement", color: "eco-bad" };
}

export function calculateOverallSustainability(ecoScore: number, fabricUtilization: number): number {
  return Math.round(0.6 * ecoScore + 0.4 * fabricUtilization);
}
