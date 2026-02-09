import { useState } from "react";
import { Sparkles, Baby, TrendingUp, SlidersHorizontal, Repeat, Check } from "lucide-react";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription 
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  productCategories, 
  stagesByAge, 
  stagesByWeight,
  type ProductCategory,
  type Stage,
} from "@/data/bundleData";
import { 
  DiapersIcon, 
  WipesIcon, 
  BodyLotionIcon, 
  BodyCreamIcon, 
  BabyWashIcon, 
  BabyOilIcon 
} from "@/components/icons/CategoryIcons";

// Feature list for the explainer view
const assistedFeatures = [
  { icon: Sparkles, title: "Smart Picks", description: "Best choice of items" },
  { icon: Baby, title: "Stage-Matched", description: "Right size for baby" },
  { icon: TrendingUp, title: "Top Sellers", description: "What parents buy most" },
  { icon: SlidersHorizontal, title: "Fully Flexible", description: "Adjust anything" },
];

// Map category IDs to their custom icons
const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'diapers': DiapersIcon,
  'wipes': WipesIcon,
  'body-lotion': BodyLotionIcon,
  'body-cream': BodyCreamIcon,
  'baby-wash': BabyWashIcon,
  'baby-oil': BabyOilIcon,
};

type DrawerStep = "explainer" | "categories" | "stages";
type SelectionMode = "age" | "weight";

interface AssistDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssistDrawer({ open, onOpenChange }: AssistDrawerProps) {
  const [step, setStep] = useState<DrawerStep>("explainer");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("age");

  const stages = selectionMode === "age" ? stagesByAge : stagesByWeight;

  const handleStartAssisted = () => {
    setStep("categories");
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCategoryContinue = () => {
    if (selectedCategoryIds.length > 0) {
      setStep("stages");
    }
  };

  const handleStageSelect = (stageId: string) => {
    setSelectedStageId(stageId);
  };

  const handleViewCurated = () => {
    if (!selectedStageId) return;
    // TODO: Navigate to curated items page
    console.log("View curated items:", { categories: selectedCategoryIds, stage: selectedStageId });
    onOpenChange(false);
    // Reset state for next time
    setTimeout(() => {
      setStep("explainer");
      setSelectedCategoryIds([]);
      setSelectedStageId(null);
    }, 300);
  };

  const handleBack = () => {
    if (step === "stages") {
      setStep("categories");
    } else if (step === "categories") {
      setStep("explainer");
    }
  };

  // Reset state when drawer closes
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setTimeout(() => {
        setStep("explainer");
        setSelectedCategoryIds([]);
        setSelectedStageId(null);
      }, 300);
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        {/* Explainer Step */}
        <div
          className={cn(
            "transition-all duration-300 ease-out",
            step === "explainer" 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-4 hidden"
          )}
        >
          <DrawerHeader className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <DrawerTitle>Assisted Shopping</DrawerTitle>
            <DrawerDescription>
              Perfect for new parents who need help finding the right products, brands, and quantities for their baby.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-6 pb-6 space-y-4">
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

          <div className="px-6 pb-8">
            <Button
              variant="shop"
              className="w-full h-12"
              onClick={handleStartAssisted}
            >
              Start Assisted Shopping
            </Button>
          </div>
        </div>

        {/* Categories Step */}
        <div
          className={cn(
            "transition-all duration-300 ease-out",
            step === "categories" 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-4 hidden"
          )}
        >
          <DrawerHeader className="text-center">
            <DrawerTitle>What do you need?</DrawerTitle>
            <DrawerDescription>
              Select all that apply
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-6 pb-6">
            <div className="grid grid-cols-3 gap-3">
              {productCategories.map((category) => {
                const isSelected = selectedCategoryIds.includes(category.id);
                const IconComponent = categoryIconMap[category.id];
                
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all aspect-square",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    {IconComponent ? (
                      <IconComponent className="w-10 h-10 mb-2" />
                    ) : (
                      <span className="text-2xl mb-2">{category.emoji}</span>
                    )}
                    <span className="text-sm font-semibold text-foreground">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Always visible CTA with inactive state */}
          <div className="px-6 pb-8 flex justify-center">
            <Button
              variant="shop"
              className={cn(
                "rounded-full px-8 h-11 transition-opacity",
                selectedCategoryIds.length === 0 && "opacity-50 cursor-not-allowed"
              )}
              onClick={handleCategoryContinue}
              disabled={selectedCategoryIds.length === 0}
            >
              Continue
            </Button>
          </div>
        </div>

        {/* Stages Step */}
        <div
          className={cn(
            "transition-all duration-300 ease-out",
            step === "stages" 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 translate-y-4 hidden"
          )}
        >
          <DrawerHeader className="text-center">
            <DrawerTitle>What's your baby's stage?</DrawerTitle>
            <DrawerDescription>
              We'll recommend the right sizes
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-6 pb-4">
            {/* Mode toggle */}
            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => setSelectionMode("age")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  selectionMode === "age"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                By Age
              </button>
              <button
                onClick={() => setSelectionMode("weight")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  selectionMode === "weight"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                By Weight
              </button>
            </div>

            {/* Stage grid */}
            <div className="grid grid-cols-3 gap-2">
              {stages.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => handleStageSelect(stage.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                    selectedStageId === stage.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <span className="text-2xl mb-1">{stage.emoji}</span>
                  <span className="text-xs font-medium text-foreground">{stage.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {selectionMode === "age" ? stage.ageRange : stage.weightRange}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Always visible CTA with inactive state */}
          <div className="px-6 pb-8 flex justify-center">
            <Button
              variant="shop"
              className={cn(
                "rounded-full px-8 h-11 transition-opacity",
                !selectedStageId && "opacity-50 cursor-not-allowed"
              )}
              onClick={handleViewCurated}
              disabled={!selectedStageId}
            >
              Proceed
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
