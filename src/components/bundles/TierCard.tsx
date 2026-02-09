import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { BundleTier } from "@/data/bundleData";
import { formatPrice } from "@/data/bundleData";

interface TierCardProps {
  tier: BundleTier;
  stageId: string;
  onClick: () => void;
}

export function TierCard({ tier, stageId, onClick }: TierCardProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Card
        className={cn(
          "p-5 transition-all hover:shadow-md relative",
          tier.isPopular && "ring-2 ring-primary"
        )}
      >
        {tier.isPopular && (
          <Badge className="absolute -top-2 right-4 bg-primary text-primary-foreground">
            Most Popular
          </Badge>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground uppercase tracking-wide">
            {tier.name}
          </h3>
          <p className="text-sm text-muted-foreground">{tier.summary}</p>
          <ul className="space-y-1.5">
            {tier.contents.map((item, index) => (
              <li key={index} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>
                  <span className="font-medium">{item.category}:</span> {item.quantity}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xl font-bold text-foreground">
              {formatPrice(tier.basePrice)}
            </span>
            <Button onClick={onClick} size="sm">
              Select
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Desktop layout - taller card with more prominence
  return (
    <Card
      className={cn(
        "p-6 transition-all hover:shadow-xl card-lift relative flex flex-col h-full",
        tier.isPopular && "ring-2 ring-primary shadow-lg"
      )}
    >
      {tier.isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1">
          ⭐ Most Popular
        </Badge>
      )}

      <div className="space-y-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xl font-bold text-foreground uppercase tracking-wide">
            {tier.name}
          </h3>
          <p className="text-sm text-muted-foreground">{tier.summary}</p>
        </div>

        <Separator />

        {/* Contents */}
        <ul className="space-y-2 flex-1">
          {tier.contents.map((item, index) => (
            <li key={index} className="text-sm text-foreground flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>
                <span className="font-medium">{item.category}:</span> {item.quantity}
              </span>
            </li>
          ))}
        </ul>

        <Separator />

        {/* Price and CTA */}
        <div className="space-y-4 mt-auto">
          <div className="text-center">
            <span className="text-3xl font-bold text-foreground">
              {formatPrice(tier.basePrice)}
            </span>
            <p className="text-xs text-muted-foreground mt-1">per bundle</p>
          </div>
          <Button onClick={onClick} className="w-full" size="lg">
            Select Bundle
          </Button>
        </div>
      </div>
    </Card>
  );
}
