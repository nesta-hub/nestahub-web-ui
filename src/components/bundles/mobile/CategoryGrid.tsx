import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { categoryIconMap } from "@/components/icons/CategoryIcons";
import type { ProductCategory } from "@/data/bundleData";

interface CategoryGridProps {
  categories: ProductCategory[];
  selectedCategoryIds: string[];
  onToggle: (categoryId: string) => void;
  onContinue: () => void;
}

export function CategoryGrid({ 
  categories, 
  selectedCategoryIds, 
  onToggle,
  onContinue,
}: CategoryGridProps) {
  const selectedCount = selectedCategoryIds.length;
  
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">What do you need?</h3>
      
      {/* 2x3 grid of category cards */}
      <div className="grid grid-cols-3 gap-2.5 stagger-fade-in">
        {categories.map((category) => {
          const isSelected = selectedCategoryIds.includes(category.id);
          
          return (
            <button
              key={category.id}
              onClick={() => onToggle(category.id)}
              className={cn(
                // Base styling
                "relative flex flex-col items-center p-3.5 rounded-2xl text-center",
                "border transition-all duration-200 card-inner-highlight",
                "active:scale-[0.97]",
                // Unselected
                "bg-card border-border shadow-soft",
                // Selected
                isSelected && [
                  "bg-primary/5 ring-2 ring-primary shadow-card",
                  "animate-select-pop"
                ]
              )}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              
              {/* Icon */}
              {(() => {
                const IconComponent = categoryIconMap[category.id];
                if (IconComponent) {
                  return <IconComponent className="w-8 h-8 mb-1" />;
                }
                return <span className="text-2xl mb-1">{category.emoji}</span>;
              })()}
              
              {/* Category name */}
              <span className={cn(
                "text-xs font-semibold",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Floating pill CTA - only shows after selection */}
      {selectedCount > 0 && (
        <div className="flex flex-col items-center pt-4 animate-fade-in-up">
          <Button
            variant="shop" 
            onClick={onContinue}
            className="rounded-full px-8 h-11 font-semibold"
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
