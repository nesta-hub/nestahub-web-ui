import { useState, useMemo, useRef, useEffect } from "react";
import { Sparkles, Baby, TrendingUp, SlidersHorizontal, Repeat, HelpCircle } from "lucide-react";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription 
} from "@/components/ui/drawer";
import { addDays } from "date-fns";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  stagesByAge, 
  stagesByWeight, 
  productCategories,
  getStageById, 
  formatPrice,
  getPriceForStage,
  calculateCategoryBasePrice,
  getRecommendedSizeForStage,
  type ConfiguredProduct,
  type ProductCategory,
} from "@/data/bundleData";
import { StageGrid } from "./StageGrid";
import { StageSummaryCard } from "./StageSummaryCard";
import { CategoryGrid } from "./CategoryGrid";
import { OrderTypeCards } from "./OrderTypeCards";
import { BundleConfigDrawer } from "./BundleConfigDrawer";
import { BundleSummaryCard } from "./BundleSummaryCard";
import { CheckoutView } from "./CheckoutView";

type OrderType = "subscribe" | "one-time" | null;
type SelectionMode = "age" | "weight";

// Feature icons for hero section - updated for Assisted Shopping
const assistedFeatures = [
  { icon: Sparkles, title: "Smart Picks", description: "Curated just for you" },
  { icon: Baby, title: "Stage-Matched", description: "Right size for baby" },
  { icon: TrendingUp, title: "Top Sellers", description: "What parents buy most" },
  { icon: SlidersHorizontal, title: "Fully Flexible", description: "Adjust anything" },
  { icon: Repeat, title: "Swap Brands", description: "Pick your favorites" },
];

export function MobileBundlePage() {
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [stageConfirmed, setStageConfirmed] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [orderType, setOrderType] = useState<OrderType>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("age");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [savedProducts, setSavedProducts] = useState<ConfiguredProduct[] | null>(null);
  const [frequency, setFrequency] = useState(4);
  const [startDate, setStartDate] = useState(() => addDays(new Date(), 1));
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);

  // Refs for scroll targets
  const categorySectionRef = useRef<HTMLDivElement>(null);
  const orderTypeSectionRef = useRef<HTMLDivElement>(null);
  const orderTypeBottomRef = useRef<HTMLDivElement>(null);

  // Get stages based on selection mode
  const stages = selectionMode === "age" ? stagesByAge : stagesByWeight;

  const selectedStage = useMemo(() => (selectedStageId ? getStageById(selectedStageId) : null), [selectedStageId]);

  const canProceed = selectedStageId && savedProducts;

  // Handle mode change (clear selection when switching)
  const handleModeChange = (mode: SelectionMode) => {
    setSelectionMode(mode);
    setSelectedStageId(null);
    setStageConfirmed(false);
    setSelectedCategoryIds([]);
    setSavedProducts(null);
  };

  // Handle stage selection - just highlights, doesn't confirm
  const handleStageSelect = (stageId: string) => {
    setSelectedStageId(stageId);
  };

  // Handle stage continue - confirms and shows summary + categories
  const handleStageContinue = () => {
    setStageConfirmed(true);
  };

  // Handle category toggle (multi-select)
  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Handle continue - opens drawer with selected categories
  const handleCategoryContinue = () => {
    setIsDrawerOpen(true);
  };

  // Handle drawer close
  const handleDrawerClose = (open: boolean) => {
    setIsDrawerOpen(open);
  };

  // Handle save from drawer
  const handleBundleSave = (products: ConfiguredProduct[]) => {
    setSavedProducts(products);
  };

  // Handle clear - resets to category selection
  const handleBundleClear = () => {
    setSavedProducts(null);
    setSelectedCategoryIds([]);
    setOrderType(null);
  };

  // Handle stage clear - resets both stage and bundle
  const handleStageClear = () => {
    setSelectedStageId(null);
    setStageConfirmed(false);
    setSelectedCategoryIds([]);
    setSavedProducts(null);
    setOrderType(null);
  };

  // Handle edit - reopens drawer
  const handleBundleEdit = () => {
    setIsDrawerOpen(true);
  };

  // Handle proceed to checkout
  const handleProceed = () => {
    setIsCheckoutOpen(true);
  };

  // Handle order complete - reset all state and scroll to top
  const handleOrderComplete = () => {
    setSelectedStageId(null);
    setStageConfirmed(false);
    setSelectedCategoryIds([]);
    setOrderType(null);
    setSavedProducts(null);
    setFrequency(4);
    setStartDate(addDays(new Date(), 1));
    setIsCheckoutOpen(false);
    
    // Delay scroll to ensure drawer is fully closed
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  };

  // Calculate total price from saved products
  const calculateTotalPrice = (products: ConfiguredProduct[]): number => {
    const basePrice = calculateCategoryBasePrice(selectedCategoryIds);
    const adjustments = products.reduce((sum, p) => {
      return sum + (p.selectedVariant.priceDelta || 0) + (p.selectedSize?.priceDelta || 0);
    }, 0);
    return getPriceForStage(basePrice + adjustments, selectedStageId);
  };

  // Auto-scroll to category section when stage is confirmed
  useEffect(() => {
    if (stageConfirmed && categorySectionRef.current) {
      setTimeout(() => {
        categorySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [stageConfirmed]);

  // Auto-scroll to order type section when products are saved
  useEffect(() => {
    if (savedProducts && orderTypeSectionRef.current) {
      setTimeout(() => {
        orderTypeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [savedProducts]);

  // Auto-scroll to bottom sentinel when order type is selected
  useEffect(() => {
    if (orderType && orderTypeBottomRef.current) {
      // Use longer delay to wait for subscription controls to animate in
      setTimeout(() => {
        orderTypeBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 350);
    }
  }, [orderType]);

  return (
    <Layout>
      <div className="min-h-screen pb-6">
        {/* Hero section */}
        <div className="bg-gradient-to-b from-primary/5 to-transparent px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Assisted Shopping</h1>
          
          <p className="text-muted-foreground mt-3 max-w-xs mx-auto">
            We'll help you find exactly what you need
          </p>
          
          <button 
            onClick={() => setIsInfoDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm text-primary mt-3 hover:underline"
          >
            <HelpCircle className="w-4 h-4" />
            Learn more
          </button>
        </div>

        <div className="px-4 space-y-6 py-6">
          {/* Stage section - show summary after confirmed, otherwise show grid with CTA */}
          {stageConfirmed && selectedStage ? (
            <StageSummaryCard
              stage={selectedStage}
              selectionMode={selectionMode}
              onClear={handleStageClear}
            />
          ) : (
            <StageGrid
              stages={stages}
              selectedStageId={selectedStageId}
              onSelect={handleStageSelect}
              onContinue={handleStageContinue}
              selectionMode={selectionMode}
              onModeChange={handleModeChange}
            />
          )}

          {/* Category section - show after stage is confirmed, hide after save */}
          {stageConfirmed && !savedProducts && (
            <>
              <Separator className="animate-fade-in-up" />

              <div ref={categorySectionRef} className="animate-fade-in-up">
                <CategoryGrid 
                  categories={productCategories}
                  selectedCategoryIds={selectedCategoryIds}
                  onToggle={handleCategoryToggle}
                  onContinue={handleCategoryContinue}
                />
              </div>
            </>
          )}

          {/* Bundle summary - only show after Save */}
          {savedProducts && selectedCategoryIds.length > 0 && (
            <>
              <Separator className="animate-fade-in-up" />

              <div ref={categorySectionRef} className="animate-fade-in-up">
                <BundleSummaryCard
                  categoryIds={selectedCategoryIds}
                  products={savedProducts}
                  totalPrice={calculateTotalPrice(savedProducts)}
                  onEdit={handleBundleEdit}
                  onClear={handleBundleClear}
                />
              </div>
            </>
          )}

          {/* Order type section - only show after Save */}
          {savedProducts && (
            <>
              <Separator className="animate-fade-in-up" />

            <div ref={orderTypeSectionRef} className="animate-fade-in-up space-y-6">
                <OrderTypeCards
                  basePrice={calculateCategoryBasePrice(selectedCategoryIds)}
                  orderType={orderType}
                  onSelect={setOrderType}
                  frequency={frequency}
                  onFrequencyChange={setFrequency}
                  startDate={startDate}
                  onStartDateChange={setStartDate}
                />

                {/* Proceed CTA - only show when order type selected */}
                {orderType && (
                  <div>
                    <Button
                      variant="shop"
                      className="w-full h-12 text-base font-semibold"
                      onClick={handleProceed}
                    >
                      Proceed
                    </Button>
                  </div>
                )}
                
                {/* Bottom sentinel for reliable scroll-to-bottom */}
                <div ref={orderTypeBottomRef} className="h-24" aria-hidden="true" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Configuration drawer */}
      <BundleConfigDrawer
        open={isDrawerOpen}
        onOpenChange={handleDrawerClose}
        categoryIds={selectedCategoryIds}
        stage={selectedStage}
        orderType={orderType}
        onSave={handleBundleSave}
      />

      {/* Checkout view */}
      <CheckoutView
        open={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onComplete={handleOrderComplete}
        orderType={orderType || 'one-time'}
        products={savedProducts}
        categoryIds={selectedCategoryIds}
        stage={selectedStage}
        totalPrice={savedProducts ? calculateTotalPrice(savedProducts) : 0}
      />

      {/* Info drawer - explains Assisted Shopping features */}
      <Drawer open={isInfoDrawerOpen} onOpenChange={setIsInfoDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>How Assisted Shopping Works</DrawerTitle>
            <DrawerDescription>
              A smarter way to shop for your baby
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-6 pb-8 space-y-4">
            {assistedFeatures.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{feature.title}</p>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </Layout>
  );
}
