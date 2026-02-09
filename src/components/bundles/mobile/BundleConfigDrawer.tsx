import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { 
  type Stage, 
  type ConfiguredProduct,
  type ProductVariant,
  type ProductSize,
  productCategories,
  getRecommendedSizeForStage,
  calculateCategoryBasePrice,
  formatPrice, 
  getSubscriptionPrice,
  getPriceForStage,
} from "@/data/bundleData";
import { ProductAccordionItem } from "./ProductAccordionItem";

interface BundleConfigDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryIds: string[];
  stage: Stage | null;
  orderType: 'subscribe' | 'one-time' | null;
  onSave?: (products: ConfiguredProduct[]) => void;
}

export function BundleConfigDrawer({
  open,
  onOpenChange,
  categoryIds,
  stage,
  orderType,
  onSave,
}: BundleConfigDrawerProps) {
  // Product configuration state
  const [products, setProducts] = useState<ConfiguredProduct[]>([]);
  
  // Accordion state - track which product is expanded
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Reinitialize products when categoryIds change
  useEffect(() => {
    if (categoryIds.length > 0) {
      setProducts(initializeProducts(categoryIds, stage?.id || null));
      setExpandedIndex(null);
    }
  }, [categoryIds, stage?.id]);

  if (categoryIds.length === 0 || !stage) return null;

  const isSubscription = orderType === 'subscribe';
  const basePrice = calculateTotalPrice(products, categoryIds);
  const stageAdjustedPrice = getPriceForStage(basePrice, stage.id);
  const finalPrice = isSubscription ? getSubscriptionPrice(stageAdjustedPrice) : stageAdjustedPrice;

  const handleVariantChange = (index: number, variant: ProductVariant) => {
    setProducts(prev => prev.map((p, i) => 
      i === index ? { ...p, selectedVariant: variant } : p
    ));
  };

  const handleSizeChange = (index: number, size: ProductSize) => {
    setProducts(prev => prev.map((p, i) => 
      i === index ? { ...p, selectedSize: size } : p
    ));
  };

  // Get selected category names for header
  const selectedCategoryNames = categoryIds
    .map(id => productCategories.find(c => c.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[92vh] flex flex-col">
        <DrawerHeader className="flex-shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-bold">
              {stage.name} • {categoryIds.length} items
            </DrawerTitle>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DrawerHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Product accordion items */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-foreground">Your Items</h4>
            <div className="space-y-2">
              {products.map((product, index) => (
                <ProductAccordionItem
                  key={index}
                  product={product}
                  isExpanded={expandedIndex === index}
                  onToggle={() => setExpandedIndex(prev => prev === index ? null : index)}
                  onVariantChange={(v) => handleVariantChange(index, v)}
                  onSizeChange={(s) => handleSizeChange(index, s)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Fixed footer with total and Save */}
        <DrawerFooter className="flex-shrink-0 border-t bg-background pt-4">
          <div className="space-y-3">
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>{formatPrice(finalPrice)}</span>
            </div>

            <Button 
              variant="shop"
              className="w-full h-12 text-base font-semibold"
              onClick={() => {
                setExpandedIndex(null); // Collapse all items
                onSave?.(products);
                onOpenChange(false);
              }}
            >
              Save
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Helper functions
function initializeProducts(
  categoryIds: string[], 
  stageId: string | null
): ConfiguredProduct[] {
  const products: ConfiguredProduct[] = [];
  
  for (const catId of categoryIds) {
    const category = productCategories.find(c => c.id === catId);
    if (!category) continue;
    
    products.push({
      category: category.name,
      quantity: category.defaultQuantity,
      selectedVariant: category.variants[0], // "Most popular" - first in array
      selectedSize: category.hasSize 
        ? getRecommendedSizeForStage(stageId || 'giggly-rollers')
        : undefined,
    });
  }
  
  return products;
}

function calculateTotalPrice(products: ConfiguredProduct[], categoryIds: string[]): number {
  const basePrice = calculateCategoryBasePrice(categoryIds);
  const adjustments = products.reduce((sum, p) => {
    return sum + (p.selectedVariant.priceDelta || 0) + (p.selectedSize?.priceDelta || 0);
  }, 0);
  return basePrice + adjustments;
}
