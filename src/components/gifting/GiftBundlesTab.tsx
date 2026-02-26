import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { api, type Bundle } from "@/lib/api";
import { GiftBundleDetailDrawer } from "./GiftBundleDetailDrawer";
import { GiftBundleItemsView } from "./GiftBundleItemsView";
import type { SelectedProduct } from "./GiftBundleItemsView";
import { getStageEmoji } from "@/lib/stageEmojis";

// Helper to format price from kobo
const formatPrice = (priceInKobo: number) => {
  const naira = priceInKobo / 100;
  return `₦${naira.toLocaleString()}`;
};

// Tier colour config (same as nesting-essentials)
const tierVisuals: Record<string, { gradient: string; overlayColor: string }> = {
  "clean-care": { gradient: "from-[hsl(30,40%,85%)] to-[hsl(30,32%,92%)]", overlayColor: "bg-[hsl(30,40%,85%)]/60" },
  "essentials": { gradient: "from-[hsl(210,32%,80%)] to-[hsl(210,25%,88%)]", overlayColor: "bg-[hsl(210,32%,80%)]/60" },
  "essentials-plus": { gradient: "from-[hsl(90,15%,75%)] to-[hsl(90,12%,85%)]", overlayColor: "bg-[hsl(90,15%,75%)]/60" },
  "care-plus": { gradient: "from-[hsl(25,28%,77%)] to-[hsl(25,22%,86%)]", overlayColor: "bg-[hsl(25,28%,77%)]/60" },
};


function GiftBundleCard({
  bundle,
  onClick,
}: {
  bundle: Bundle;
  onClick: () => void;
}) {
  const visuals = tierVisuals[bundle.slug] ?? { gradient: "from-secondary/60 to-secondary/20", overlayColor: "bg-secondary/60" };
  const maxVisible = 3;
  const remaining = bundle.categories.length - maxVisible;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 w-36 rounded-2xl text-left snap-start flex flex-col overflow-hidden",
        "bg-card border border-border",
        "shadow-sm hover:shadow-md hover:border-primary/30",
        "transition-all duration-200 active:scale-[0.98]"
      )}
    >
      <div className={cn("w-full aspect-[2/1] bg-gradient-to-br relative overflow-hidden", visuals.gradient)}>
        <span className="absolute inset-0 flex items-center justify-center text-4xl opacity-[0.50]">🎁</span>
        <div className={cn("absolute inset-0", visuals.overlayColor.replace("/60", "/40"))} />
      </div>
      <div className="p-2.5 flex flex-col flex-1">
        <h3 className="font-semibold text-foreground text-sm mb-1.5 leading-tight">{bundle.name}</h3>
        <div className="space-y-0.5 mb-1.5">
          {bundle.categories.slice(0, remaining > 0 ? maxVisible : bundle.categories.length).map((cat, i) => {
            const isLast = remaining > 0 && i === maxVisible - 1;
            return (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-primary/50 shrink-0" />
                <span className="text-[11px] text-muted-foreground truncate">
                  {cat.name}
                  {isLast && <span className="text-muted-foreground/60"> +{remaining} more</span>}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex-1" />
        <div className="pt-1.5 border-t border-border/50">
          <p className="text-sm font-bold text-foreground">{formatPrice(bundle.totalPrice)}</p>
        </div>
      </div>
    </button>
  );
}

interface AgeGroupSectionProps {
  id: string;
  name: string;
  ageRange: string;
  emoji: string;
  bundles: Bundle[];
  onSelectBundle: (bundleId: string, ageGroupSlug: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

function AgeGroupSection({
  id,
  name,
  ageRange,
  emoji,
  bundles,
  onSelectBundle,
  isExpanded,
  onToggle,
}: AgeGroupSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <span>{name}</span>
          <span className="bg-secondary text-muted-foreground font-normal text-sm rounded-full px-2.5 py-0.5">
            {ageRange}
          </span>
        </h2>
        <ChevronDown className={cn(
          "w-5 h-5 text-muted-foreground transition-transform duration-200",
          isExpanded && "rotate-180"
        )} />
      </button>

      <div className={cn(
        "transition-all duration-300 ease-in-out overflow-hidden",
        isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div ref={scrollRef} className={cn(
          "flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide ml-4",
          isExpanded && "animate-fade-in"
        )}>
          {bundles.map((bundle) => (
            <GiftBundleCard
              key={bundle.id}
              bundle={bundle}
              onClick={() => onSelectBundle(bundle.id, id)}
            />
          ))}
          <div className="w-4 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
}

export function GiftBundlesTab() {
  const navigate = useNavigate();
  const { addToCart, clearCart } = useCart();

  // Fetch bundles from API
  const { data: bundlesData, isLoading } = useQuery({
    queryKey: ['bundles'],
    queryFn: api.getBundles,
  });

  // Map API data to display stages
  const displayStages = bundlesData?.ageGroups.slice(0, 3).map(ag => ({
    id: ag.ageGroup.slug,
    name: ag.ageGroup.name,
    ageRange: ag.ageGroup.ageRangeStart !== undefined && ag.ageGroup.ageRangeEnd !== undefined
      ? `${ag.ageGroup.ageRangeStart}-${ag.ageGroup.ageRangeEnd} months`
      : '',
    emoji: getStageEmoji(ag.ageGroup.slug),
    bundles: ag.bundles,
  })) || [];

  const [expandedStage, setExpandedStage] = useState<number>(0);
  const toggleStage = useCallback((index: number) => {
    setExpandedStage(prev => prev === index ? -1 : index);
  }, []);

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [selectedAgeGroupSlug, setSelectedAgeGroupSlug] = useState<string | null>(null);
  const [itemsViewOpen, setItemsViewOpen] = useState(false);

  const handleSelectBundle = (bundleId: string, ageGroupSlug: string) => {
    setSelectedBundleId(bundleId);
    setSelectedAgeGroupSlug(ageGroupSlug);
    setDetailDrawerOpen(true);
  };

  const handleDetailContinue = () => {
    setDetailDrawerOpen(false);
    setTimeout(() => setItemsViewOpen(true), 200);
  };

  const handleProceed = (selectedItems: SelectedProduct[]) => {
    clearCart();
    selectedItems.forEach((item) => {
      addToCart(
        {
          variantId: item.variant.id,
          productId: item.variant.product.id,
          productName: item.variant.product.name,
          brand: item.variant.product.brand,
          slug: item.variant.product.slug,
          // Legacy fields for backwards compatibility
          typeId: item.variant.id,
          typeName: item.categoryName,
          sizeId: undefined,
          sizeName: undefined,
          // API fields
          attributes: item.variant.attributes,
          unitPrice: item.variant.price,
          image: item.variant.imageUrl,
        },
        item.quantity
      );
    });

    navigate("/checkout?source=gifting");
    setTimeout(() => setItemsViewOpen(false), 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading bundles...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 py-4">
        {displayStages.map((stage, index) => (
          <AgeGroupSection
            key={stage.id}
            id={stage.id}
            name={stage.name}
            ageRange={stage.ageRange}
            emoji={stage.emoji}
            bundles={stage.bundles}
            onSelectBundle={handleSelectBundle}
            isExpanded={expandedStage === index}
            onToggle={() => toggleStage(index)}
          />
        ))}
      </div>

      <GiftBundleDetailDrawer
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        bundleId={selectedBundleId}
        ageGroupSlug={selectedAgeGroupSlug}
        onContinue={handleDetailContinue}
      />

      {selectedBundleId && selectedAgeGroupSlug && (
        <GiftBundleItemsView
          open={itemsViewOpen}
          onClose={() => setItemsViewOpen(false)}
          bundleId={selectedBundleId}
          ageGroupSlug={selectedAgeGroupSlug}
          onProceed={handleProceed}
        />
      )}
    </>
  );
}
