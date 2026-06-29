import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Sparkles, Baby, Heart, Gift, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { api, type Bundle } from "@/lib/api";
import { GiftBundleDetailDrawer } from "./GiftBundleDetailDrawer";
import { GiftBundleItemsView } from "./GiftBundleItemsView";
import type { SelectedProduct } from "./GiftBundleItemsView";

// Family icon by gift-category slug (replaces the old age-group emojis)
const FAMILY_ICONS: Record<string, LucideIcon> = {
  baby: Baby,
  mom: Heart,
  mum: Heart,
  complete: Package,
  "complete-set": Package,
};

// Helper to format price from kobo
const formatPrice = (priceInKobo: number) => {
  const naira = priceInKobo / 100;
  return `₦${naira.toLocaleString()}`;
};

// Size colour config keyed by size slug
const sizeVisuals: Record<string, { gradient: string; overlayColor: string }> = {
  small: { gradient: "from-[hsl(30,40%,85%)] to-[hsl(30,32%,92%)]", overlayColor: "bg-[hsl(30,40%,85%)]/40" },
  medium: { gradient: "from-[hsl(350,45%,86%)] to-[hsl(350,35%,92%)]", overlayColor: "bg-[hsl(350,45%,86%)]/40" },
  large: { gradient: "from-[hsl(90,15%,75%)] to-[hsl(90,12%,85%)]", overlayColor: "bg-[hsl(90,15%,75%)]/40" },
};

function GiftBundleCard({ bundle, onClick }: { bundle: Bundle; onClick: () => void }) {
  const visuals = sizeVisuals[bundle.size?.slug] ?? {
    gradient: "from-secondary/60 to-secondary/20",
    overlayColor: "bg-secondary/40",
  };
  const maxVisible = 3;
  const remaining = bundle.categories.length - maxVisible;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 w-36 rounded-2xl text-left snap-start flex flex-col overflow-hidden",
        "bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30",
        "transition-all duration-200 active:scale-[0.98]"
      )}
    >
      <div className={cn("w-full aspect-[2/1] bg-gradient-to-br relative overflow-hidden", visuals.gradient)}>
        <Gift className="absolute inset-0 m-auto w-9 h-9 text-foreground/25" strokeWidth={1.5} />
        <span className="absolute top-1.5 left-1.5 text-[10px] font-semibold bg-card/80 text-foreground rounded-full px-2 py-0.5">
          {bundle.size?.name}
        </span>
        <div className={cn("absolute inset-0", visuals.overlayColor)} />
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

interface GiftCategorySectionProps {
  name: string;
  description: string;
  Icon: LucideIcon;
  bundles: Bundle[];
  onSelectBundle: (bundleId: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

function GiftCategorySection({
  name,
  description,
  Icon,
  bundles,
  onSelectBundle,
  isExpanded,
  onToggle,
}: GiftCategorySectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <button onClick={onToggle} className="w-full px-4 mb-3 text-left">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 min-w-0">
            <Icon className="w-5 h-5 text-primary shrink-0" strokeWidth={1.75} />
            <span className="truncate">{name}</span>
          </h2>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0",
              isExpanded && "rotate-180"
            )}
          />
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5 ml-8 leading-snug">
            {description}
          </p>
        )}
      </button>

      <div
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div
          ref={scrollRef}
          className={cn(
            "flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide ml-4",
            isExpanded && "animate-fade-in"
          )}
        >
          {bundles.map((bundle) => (
            <GiftBundleCard key={bundle.id} bundle={bundle} onClick={() => onSelectBundle(bundle.id)} />
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

  const { data: bundlesData, isLoading } = useQuery({
    queryKey: ['bundles'],
    queryFn: api.getBundles,
  });

  // Map API data to display sections (one per gift category)
  const sections = bundlesData?.giftCategories.map((gc) => ({
    id: gc.giftCategory.slug,
    name: gc.giftCategory.name,
    description: gc.giftCategory.description ?? '',
    Icon: FAMILY_ICONS[gc.giftCategory.slug] ?? Gift,
    bundles: gc.bundles,
  })) || [];

  const [expandedSection, setExpandedSection] = useState<number>(0);
  const toggleSection = useCallback((index: number) => {
    setExpandedSection((prev) => (prev === index ? -1 : index));
  }, []);

  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [itemsViewOpen, setItemsViewOpen] = useState(false);

  const handleSelectBundle = (bundleId: string) => {
    setSelectedBundleId(bundleId);
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
          typeId: item.variant.id,
          typeName: item.categoryName,
          sizeId: undefined,
          sizeName: undefined,
          attributes: item.variant.attributes,
          unitPrice: item.variant.price,
          image: item.variant.imageUrl,
        },
        item.quantity
      );
    });

    navigate(`/checkout?source=gifting&bundleId=${selectedBundleId ?? ''}`);
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
        {/* Build-your-own entry point */}
        <button
          onClick={() => navigate("/gifting/build")}
          className="mx-4 w-[calc(100%-2rem)] flex items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-left transition-colors hover:bg-primary/10"
        >
          <span className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </span>
          <span>
            <span className="block font-semibold text-foreground">Build your own gift set</span>
            <span className="block text-sm text-muted-foreground">Pick a box and fill it with anything you like</span>
          </span>
        </button>

        {sections.map((section, index) => (
          <GiftCategorySection
            key={section.id}
            name={section.name}
            description={section.description}
            Icon={section.Icon}
            bundles={section.bundles}
            onSelectBundle={handleSelectBundle}
            isExpanded={expandedSection === index}
            onToggle={() => toggleSection(index)}
          />
        ))}
      </div>

      <GiftBundleDetailDrawer
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        bundleId={selectedBundleId}
        onContinue={handleDetailContinue}
      />

      {selectedBundleId && (
        <GiftBundleItemsView
          open={itemsViewOpen}
          onClose={() => setItemsViewOpen(false)}
          bundleId={selectedBundleId}
          onProceed={handleProceed}
        />
      )}
    </>
  );
}
