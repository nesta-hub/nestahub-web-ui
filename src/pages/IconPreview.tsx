import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import {
  DiapersIcon,
  WipesIcon,
  BodyLotionIcon,
  BodyCreamIcon,
  BabyWashIcon,
  BabyOilIcon,
} from "@/components/icons/CategoryIcons";

interface IconItem {
  id: string;
  name: string;
  component: React.FC<{ className?: string }>;
}

const icons: IconItem[] = [
  { id: "diapers", name: "Diapers", component: DiapersIcon },
  { id: "wipes", name: "Wipes", component: WipesIcon },
  { id: "body-lotion", name: "Body Lotion", component: BodyLotionIcon },
  { id: "body-cream", name: "Body Cream", component: BodyCreamIcon },
  { id: "baby-wash", name: "Baby Wash", component: BabyWashIcon },
  { id: "baby-oil", name: "Baby Oil", component: BabyOilIcon },
];

export default function IconPreview() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Category Icon Preview</h1>
            <p className="text-muted-foreground">
              Inline SVG icons with transparent backgrounds
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-primary" />
            All {icons.length} SVG icons ready
          </div>
        </div>

        {/* Progress (all complete) */}
        <div className="flex gap-1">
          {icons.map((icon) => (
            <div
              key={icon.id}
              className="h-2 flex-1 rounded-full bg-primary"
            />
          ))}
        </div>

        {/* Icon Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {icons.map((icon) => {
            const IconComponent = icon.component;
            return (
              <Card key={icon.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{icon.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Preview area - shows transparency */}
                  <div className="aspect-square rounded-lg flex items-center justify-center overflow-hidden border relative">
                    {/* Checkerboard pattern to show transparency */}
                    <div 
                      className="absolute inset-0" 
                      style={{
                        backgroundImage: `
                          linear-gradient(45deg, #e0e0e0 25%, transparent 25%),
                          linear-gradient(-45deg, #e0e0e0 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #e0e0e0 75%),
                          linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)
                        `,
                        backgroundSize: '16px 16px',
                        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                      }}
                    />
                    <IconComponent className="w-16 h-16 relative z-10" />
                  </div>

                  {/* On card background */}
                  <div className="flex items-center gap-2 p-2 bg-card rounded-lg border">
                    <IconComponent className="w-8 h-8" />
                    <span className="text-xs text-muted-foreground">On card bg</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Context Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">In-Context Preview (CategoryGrid)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2.5 max-w-xs">
              {icons.map((icon) => {
                const IconComponent = icon.component;
                return (
                  <div
                    key={icon.id}
                    className="flex flex-col items-center p-3.5 rounded-2xl border bg-card text-center"
                  >
                    <IconComponent className="w-8 h-8 mb-1" />
                    <span className="text-xs font-medium">{icon.name}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Technical details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Technical Details</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p><strong>Type:</strong> Inline SVG components</p>
            <p><strong>Fill:</strong> hsl(30, 20%, 96%) - matches --background</p>
            <p><strong>Stroke:</strong> hsl(28, 18%, 56%) - matches --primary (tan)</p>
            <p><strong>Background:</strong> True transparent</p>
            <p><strong>Scalable:</strong> Yes - vector-based, no quality loss</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
