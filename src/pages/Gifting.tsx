import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import { SelectedProduct } from "@/components/gifting/GiftBundleItemsView";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout";
import { cn } from "@/lib/utils";
import { api, type AgeGroup, type Bundle, type BundleCategory } from "@/lib/api";
import { GiftBundleDetailDrawer } from "@/components/gifting/GiftBundleDetailDrawer";
import { GiftBundleItemsView } from "@/components/gifting/GiftBundleItemsView";

// Helper to format price from kobo
const formatPrice = (priceInKobo: number) => {
  const naira = priceInKobo / 100;
  return `₦${naira.toLocaleString()}`;
};

// Map API types to UI types for compatibility
type UIStage = {
  id: string;
  name: string;
  ageRange?: string;
  emoji: string;
};

type UITier = {
  id: string;
  name: string;
  contents: { category: string; quantity: string }[];
  basePrice: number;
};

// Bundle card for gifting carousel
function GiftBundleCard({
  tier,
  onClick,
}: {
  tier: UITier;
  onClick: () => void;
}) {
  const maxVisible = 3;
  const remaining = tier.contents.length - maxVisible;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 w-40 p-3 rounded-xl text-left snap-start flex flex-col",
        "bg-card border border-border",
        "shadow-sm hover:shadow-md hover:border-primary/30",
        "transition-all duration-200 active:scale-[0.98]"
      )}
    >
      {/* Header */}
      <div className="mb-2">
        <h3 className="font-semibold text-foreground text-sm">
          {tier.name}
        </h3>
      </div>

      {/* Items list - fixed height for alignment */}
      <div className="h-[56px] space-y-1 mb-2">
        {tier.contents.slice(0, remaining > 0 ? maxVisible : tier.contents.length).map((item, i) => {
          const isLast = remaining > 0 && i === maxVisible - 1;
          return (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-primary/50 shrink-0" />
              <span className="text-[11px] text-muted-foreground truncate">
                {item.category}
                {isLast && (
                  <span className="text-muted-foreground/60"> · +{remaining} more</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Spacer to push price to bottom */}
      <div className="flex-1" />

      {/* Price section */}
      <div className="pt-1.5 border-t border-border/50">
        <p className="text-[10px] text-muted-foreground">from</p>
        <p className="text-sm font-bold text-foreground">
          {formatPrice(tier.basePrice)}
        </p>
      </div>
    </button>
  );
}

// Age group section with scrollable bundles
function AgeGroupSection({
  stage,
  tiers,
  onSelectBundle,
}: {
  stage: UIStage;
  tiers: UITier[];
  onSelectBundle: (tierId: string, stageId: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 160;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className="animate-fade-in">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-semibold text-foreground">
          {stage.name}
          {stage.ageRange && (
            <span className="text-muted-foreground font-normal text-sm"> · {stage.ageRange}</span>
          )}
        </h2>
        <button
          onClick={() => handleScroll('right')}
          className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Bundle carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide ml-4"
      >
        {tiers.map((tier) => (
          <GiftBundleCard
            key={tier.id}
            tier={tier}
            onClick={() => onSelectBundle(tier.id, stage.id)}
          />
        ))}
        <div className="w-4 flex-shrink-0" />
      </div>
    </div>
  );
}

const Gifting = () => {
  const navigate = useNavigate();
  const { addToCart, clearCart} = useCart();

  // Fetch bundles from API
  const { data: bundlesData, isLoading, error } = useQuery({
    queryKey: ['bundles'],
    queryFn: api.getBundles,
  });

  // Drawer state
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [itemsViewOpen, setItemsViewOpen] = useState(false);

  // Map API data to UI format
  const displayStages: UIStage[] = bundlesData?.ageGroups.slice(0, 3).map(ag => ({
    id: ag.ageGroup.slug,
    name: ag.ageGroup.name,
    ageRange: ag.ageGroup.ageRangeStart !== undefined && ag.ageGroup.ageRangeEnd !== undefined
      ? `${ag.ageGroup.ageRangeStart}-${ag.ageGroup.ageRangeEnd} months`
      : undefined,
    emoji: '👶',
  })) || [];

  // Create a map of bundles by stage for quick lookup
  const bundlesByStage = new Map<string, UITier[]>();
  bundlesData?.ageGroups.forEach(ag => {
    const tiers: UITier[] = ag.bundles.map(bundle => ({
      id: bundle.slug,
      name: bundle.name,
      contents: bundle.categories.map(cat => ({
        category: cat.displayName,
        quantity: `${cat.productCount} ${cat.productCount === 1 ? 'product' : 'products'}`,
      })),
      basePrice: bundle.totalPrice,
    }));
    bundlesByStage.set(ag.ageGroup.slug, tiers);
  });

  // Find selected tier and stage
  const selectedStageData = bundlesData?.ageGroups.find(ag => ag.ageGroup.slug === selectedStageId);
  const selectedBundleData = selectedStageData?.bundles.find(b => b.slug === selectedTierId);

  const selectedTier = selectedBundleData ? {
    id: selectedBundleData.slug,
    name: selectedBundleData.name,
    contents: selectedBundleData.categories.map(cat => ({
      category: cat.displayName,
      quantity: `${cat.productCount} products`,
    })),
    basePrice: selectedBundleData.totalPrice,
  } : null;

  const selectedStage = selectedStageData ? {
    id: selectedStageData.ageGroup.slug,
    name: selectedStageData.ageGroup.name,
    ageRange: selectedStageData.ageGroup.ageRangeStart !== undefined && selectedStageData.ageGroup.ageRangeEnd !== undefined
      ? `${selectedStageData.ageGroup.ageRangeStart}-${selectedStageData.ageGroup.ageRangeEnd} months`
      : undefined,
    emoji: '👶',
  } : null;

  const selectedContents = selectedBundleData?.categories.map(cat => ({
    category: cat.displayName,
    quantity: cat.description || `${cat.productCount} products`,
  })) || [];

  const handleSelectBundle = (tierId: string, stageId: string) => {
    setSelectedTierId(tierId);
    setSelectedStageId(stageId);
    setDetailDrawerOpen(true);
  };

  const handleDetailContinue = () => {
    setDetailDrawerOpen(false);
    setTimeout(() => setItemsViewOpen(true), 200);
  };

  const handleProceed = (selectedItems: SelectedProduct[]) => {
    clearCart();
    selectedItems.forEach(item => {
      addToCart({
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
      }, item.quantity);
    });

    navigate("/checkout?source=gifting");
    setTimeout(() => setItemsViewOpen(false), 100);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="container py-8">
          <p className="text-destructive text-center">Failed to load bundles. Please try again.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pb-24">
        {/* Header */}
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-foreground">Gifting</h1>
          <p className="text-muted-foreground mt-1">
            Perfect curated gift bundles for every stage
          </p>
        </div>

        {/* Age group sections */}
        <div className="space-y-8 py-4">
          {displayStages.map((stage) => (
            <AgeGroupSection
              key={stage.id}
              stage={stage}
              tiers={bundlesByStage.get(stage.id) || []}
              onSelectBundle={handleSelectBundle}
            />
          ))}
        </div>
      </div>

      {/* Bundle detail drawer */}
      <GiftBundleDetailDrawer
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        tier={selectedTier || null}
        stage={selectedStage || null}
        contents={selectedContents}
        onContinue={handleDetailContinue}
      />

      {/* Items review view */}
      {selectedTierId && selectedStageId && (
        <GiftBundleItemsView
          open={itemsViewOpen}
          onClose={() => setItemsViewOpen(false)}
          bundleSlug={selectedTierId}
          ageGroupSlug={selectedStageId}
          onProceed={handleProceed}
        />
      )}
    </Layout>
  );
};

export default Gifting;
