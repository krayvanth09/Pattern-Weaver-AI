import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PatternInputForm } from "@/components/PatternInputForm";
import { EcoScoreGauge } from "@/components/EcoScoreGauge";
import { GarmentLayout } from "@/components/GarmentLayout";
import { MetricsCards } from "@/components/MetricsCards";
import {
  GARMENT_TYPES,
  analyzeImageEcoScore,
  calculateFabricUtilization,
  calculateOverallSustainability,
  getEcoLabel,
  type EcoMetrics,
} from "@/lib/sustainability";
import { Leaf, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Index() {
  const [isLoading, setIsLoading] = useState(false);
  const [patternImage, setPatternImage] = useState<string | null>(null);
  const [ecoMetrics, setEcoMetrics] = useState<EcoMetrics | null>(null);
  const [selectedGarment, setSelectedGarment] = useState(GARMENT_TYPES[0]);
  const [fabricUtil, setFabricUtil] = useState<number>(0);
  const [overallScore, setOverallScore] = useState<number>(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const analyzePattern = useCallback((imgElement: HTMLImageElement, garmentId: string) => {
    const metrics = analyzeImageEcoScore(imgElement);
    setEcoMetrics(metrics);

    const garment = GARMENT_TYPES.find((g) => g.id === garmentId) || GARMENT_TYPES[0];
    setSelectedGarment(garment);
    const { utilization } = calculateFabricUtilization(garment);
    setFabricUtil(utilization);
    setOverallScore(calculateOverallSustainability(metrics.ecoScore, utilization));
  }, []);

  const handleGenerate = async (prompt: string, garmentType: string, referenceImage?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pattern", {
        body: { prompt, garmentType, referenceImage },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const imageUrl = data.imageUrl;
      setPatternImage(imageUrl);

      // Analyze once image loads
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => analyzePattern(img, garmentType);
      img.src = imageUrl;

      toast.success("Pattern generated successfully!");
    } catch (err: any) {
      console.error("Generation failed:", err);
      toast.error(err.message || "Failed to generate pattern");
    } finally {
      setIsLoading(false);
    }
  };

  const ecoLabel = ecoMetrics ? getEcoLabel(ecoMetrics.ecoScore) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">EcoWeave AI</h1>
            <p className="text-xs text-muted-foreground">Sustainable Textile Pattern Generator</p>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[380px_1fr] gap-8">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">
                Design Your Pattern
              </h2>
              <PatternInputForm onGenerate={handleGenerate} isLoading={isLoading} />
            </div>

            {/* Eco Metrics */}
            {ecoMetrics && (
              <div className="bg-card rounded-xl border border-border p-6 shadow-card animate-fade-up">
                <h3 className="text-lg font-display font-semibold text-foreground mb-4">
                  Sustainability Metrics
                </h3>
                <MetricsCards
                  metrics={ecoMetrics}
                  fabricUtilization={fabricUtil}
                  overallScore={overallScore}
                />
              </div>
            )}
          </div>

          {/* Right Panel - Output */}
          <div className="space-y-6">
            {/* Pattern Display */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-semibold text-foreground">
                  Generated Pattern
                </h3>
                {patternImage && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = patternImage;
                        a.download = "pattern.png";
                        a.click();
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" /> Save
                    </Button>
                  </div>
                )}
              </div>

              {patternImage ? (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden border border-border bg-muted aspect-square">
                    <img
                      ref={imgRef}
                      src={patternImage}
                      alt="Generated textile pattern"
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                    {ecoLabel && (
                      <div
                        className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold text-primary-foreground"
                        style={{ backgroundColor: `hsl(var(--${ecoLabel.color}))` }}
                      >
                        {ecoLabel.label}
                      </div>
                    )}
                  </div>

                  {/* Tiled preview */}
                  <div>
                    <h4 className="text-sm font-display font-semibold text-foreground mb-2">Tiled Preview</h4>
                    <div
                      className="h-32 rounded-lg border border-border"
                      style={{
                        backgroundImage: `url(${patternImage})`,
                        backgroundSize: "100px 100px",
                        backgroundRepeat: "repeat",
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                  <div className="text-center space-y-3">
                    <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                      <Leaf className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-display font-medium text-foreground">No pattern yet</p>
                      <p className="text-xs text-muted-foreground">Describe your pattern and click generate</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Eco Score Gauge & Garment Layout */}
            {ecoMetrics && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border border-border p-6 shadow-card animate-fade-up">
                  <h3 className="text-sm font-display font-semibold text-foreground mb-4 text-center">
                    Eco Score
                  </h3>
                  <div className="flex justify-center relative">
                    <EcoScoreGauge score={ecoMetrics.ecoScore} label={ecoLabel?.label || ""} />
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-6 shadow-card animate-fade-up">
                  <GarmentLayout garment={selectedGarment} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
