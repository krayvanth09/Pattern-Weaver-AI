import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GARMENT_TYPES } from "@/lib/sustainability";
import { Leaf, Sparkles, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";

interface PatternInputFormProps {
  onGenerate: (prompt: string, garmentType: string, referenceImage?: string) => void;
  isLoading: boolean;
}

export function PatternInputForm({ onGenerate, isLoading }: PatternInputFormProps) {
  const [prompt, setPrompt] = useState("");
  const [garmentType, setGarmentType] = useState("tshirt");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onGenerate(prompt.trim(), garmentType, referenceImage || undefined);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB limit

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setReferenceImage(base64);
      setReferencePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setReferenceImage(null);
    setReferencePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const suggestions = [
    "Tropical botanical with palm leaves",
    "Geometric minimalist triangles",
    "Watercolor floral pastel",
    "Abstract brush strokes earth tones",
    "Japanese wave pattern indigo",
    "Art deco gold lines on navy",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2 font-display">
          Pattern Description
        </label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your ideal textile pattern..."
          className="min-h-[100px] bg-background border-border focus:ring-primary resize-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setPrompt(s)}
            className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Reference Image Upload */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2 font-display">
          Reference Image <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        {referencePreview ? (
          <div className="relative rounded-lg border border-border overflow-hidden bg-muted">
            <img
              src={referencePreview}
              alt="Reference"
              className="w-full h-32 object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-background/80 text-xs text-foreground flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              Reference loaded
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 transition-colors"
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Upload reference image for style transfer
            </span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2 font-display">
          Garment Type
        </label>
        <Select value={garmentType} onValueChange={setGarmentType}>
          <SelectTrigger className="bg-background border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GARMENT_TYPES.map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !prompt.trim()}
        className="w-full gradient-primary text-primary-foreground font-display font-semibold text-base py-6 hover:opacity-90 transition-opacity"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating Pattern...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            {referenceImage ? "Generate from Reference" : "Generate Sustainable Pattern"}
          </>
        )}
      </Button>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Leaf className="h-3.5 w-3.5 text-primary" />
        <span>Eco-score will be calculated automatically</span>
      </div>
    </form>
  );
}
