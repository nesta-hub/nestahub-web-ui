import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { SelectedProduct } from "@/components/gifting/GiftBundleItemsView";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Layout } from "@/components/layout";
import { cn } from "@/lib/utils";
import { 
  stagesByAge, 
  bundleTiers,
  formatPrice,
  getPriceForStage,
  getBundleContentsForStage,
  getTierById,
  getStageById,
  type Stage,
  type BundleTier,
  type BundleItem,
} from "@/data/bundleData";
import { GiftBundleDetailDrawer } from "@/components/gifting/GiftBundleDetailDrawer";
import { GiftBundleItemsView } from "@/components/gifting/GiftBundleItemsView";

// Bundle card for gifting carousel
function GiftBundleCard({
  tier,
  stageId,
  contents,
  onClick,
}: {
  tier: BundleTier;
  stageId: string;
  contents: BundleItem[];
  onClick: () => void;
}) {
  const price = getPriceForStage(tier.basePrice, stageId);
  const maxVisible = 3;
  const remaining = contents.length - maxVisible;
  
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
        {contents.slice(0, remaining > 0 ? maxVisible : contents.length).map((item, i) => {
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
          {formatPrice(price)}
        </p>
      </div>
    </button>
  );
}

// Age group section with scrollable bundles
function AgeGroupSection({
  stage,
  onSelectBundle,
}: {
  stage: Stage;
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
          <span className="text-muted-foreground font-normal text-sm"> · {stage.ageRange}</span>
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
        {bundleTiers.map((tier) => {
          const contents = getBundleContentsForStage(tier.id, stage.id);
          return (
            <GiftBundleCard
              key={tier.id}
              tier={tier}
              stageId={stage.id}
              contents={contents}
              onClick={() => onSelectBundle(tier.id, stage.id)}
            />
          );
        })}
        <div className="w-4 flex-shrink-0" />
      </div>
    </div>
  );
}

const Gifting = () => {
  const navigate = useNavigate();
  const { addToCart, clearCart } = useCart();
  const displayStages = stagesByAge.slice(0, 3);
  
  // Drawer state
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [itemsViewOpen, setItemsViewOpen] = useState(false);
  
  const selectedTier = selectedTierId ? getTierById(selectedTierId) : null;
  const selectedStage = selectedStageId ? getStageById(selectedStageId) : null;
  const selectedContents = selectedTierId && selectedStageId 
    ? getBundleContentsForStage(selectedTierId, selectedStageId) 
    : [];
  
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
      const type = item.product.types.find(t => t.id === item.selectedTypeId);
      const size = item.product.sizes?.find(s => s.id === item.selectedSizeId);
      const unitPrice = (type?.price || 0) + (size?.priceDelta || 0);

      addToCart({
        productId: item.product.id,
        productName: item.product.name,
        brand: item.product.brand,
        typeId: item.selectedTypeId,
        typeName: type?.name || '',
        sizeId: item.selectedSizeId,
        sizeName: size?.name,
        unitPrice,
        image: item.product.image,
      }, item.quantity);
    });

    navigate("/checkout?source=gifting");
    setTimeout(() => setItemsViewOpen(false), 100);
  };
  
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
      {selectedTier && selectedStage && (
        <GiftBundleItemsView
          open={itemsViewOpen}
          onClose={() => setItemsViewOpen(false)}
          tier={selectedTier}
          stage={selectedStage}
          contents={selectedContents}
          onProceed={handleProceed}
        />
      )}
    </Layout>
  );
};

export default Gifting;
