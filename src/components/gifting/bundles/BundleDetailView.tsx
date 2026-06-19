import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatGiftPrice,
  tierGradient,
  type GiftPackage,
} from "@/data/giftCatalogue";
import { BundleImageCarousel } from "./BundleImageCarousel";
import { BundleIncludedList } from "./BundleIncludedList";

interface BundleDetailViewProps {
  pkg: GiftPackage;
  onBack: () => void;
  onContinue: () => void;
}

export function BundleDetailView({ pkg, onBack, onContinue }: BundleDetailViewProps) {
  const gradient = tierGradient[pkg.category][pkg.tier];

  return (
    <div className="min-h-screen pb-28 animate-fade-in">
      {/* Edge-to-edge carousel with floating top controls */}
      <div className="relative">
        <BundleImageCarousel
          images={pkg.galleryImages}
          gradient={gradient}
          alt={pkg.name}
          edgeToEdge
        />

        {/* Floating back button */}
        <div className="absolute top-0 left-0 px-4 pt-4 z-10">
          <button
            onClick={onBack}
            aria-label="Back"
            className="w-10 h-10 rounded-full bg-card/95 backdrop-blur flex items-center justify-center shadow-md active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Title row */}
      <div className="px-4 pt-5 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold text-foreground leading-tight">
            {pkg.name}
          </h1>
          {pkg.description && (
            <p className="text-sm text-muted-foreground mt-1">{pkg.description}</p>
          )}
        </div>
        {pkg.items.length > 0 && (
          <span className="shrink-0 mt-1 px-2.5 py-1 rounded-full bg-secondary/70 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/80">
            {pkg.items.length} items
          </span>
        )}
      </div>

      {/* What's Included */}
      <div className="px-4 pt-5">
        <h2 className="text-base font-semibold text-foreground mb-3">What's Included</h2>
        <BundleIncludedList items={pkg.items} />
      </div>

      {/* Sticky footer — checkout style */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border p-4">
        <Button
          variant="shop"
          className="w-full h-12 text-base font-semibold rounded-full"
          onClick={onContinue}
        >
          <span>Continue · {formatGiftPrice(pkg.price)}</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
