import { useState, useRef, useEffect } from "react";
import { Package, ChevronUp, ChevronDown, Check } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type ConfiguredProduct,
  type ProductVariant,
  type ProductSize,
  diaperVariants,
  diaperSizes,
  wipesVariants,
  skinCareVariants,
  formatPrice,
} from "@/data/bundleData";

interface ProductAccordionItemProps {
  product: ConfiguredProduct;
  isExpanded: boolean;
  onToggle: () => void;
  onVariantChange: (variant: ProductVariant) => void;
  onSizeChange: (size: ProductSize) => void;
}

export function ProductAccordionItem({
  product,
  isExpanded,
  onToggle,
  onVariantChange,
  onSizeChange,
}: ProductAccordionItemProps) {
  const [editingAttribute, setEditingAttribute] = useState<'brand' | 'product' | 'size' | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const productScrollRef = useRef<HTMLDivElement>(null);

  // Determine which variants to show based on category
  const variants = product.category === 'Diapers'
    ? diaperVariants
    : product.category === 'Wipes'
    ? wipesVariants
    : skinCareVariants;

  const showSizes = product.category === 'Diapers';

  // Scroll when accordion expands
  useEffect(() => {
    if (isExpanded && itemRef.current) {
      setTimeout(() => {
        itemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    }
  }, [isExpanded]);

  // Scroll when editing product attribute - scroll to show Size section below
  useEffect(() => {
    if (editingAttribute === 'product' && productScrollRef.current) {
      setTimeout(() => {
        productScrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [editingAttribute]);

  const toggleAttribute = (attr: 'brand' | 'product' | 'size') => {
    setEditingAttribute(prev => prev === attr ? null : attr);
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    onVariantChange(variant);
    setEditingAttribute(null);
  };

  const handleSizeSelect = (size: ProductSize) => {
    onSizeChange(size);
    setEditingAttribute(null);
  };

  // Reset editing state when accordion collapses
  const handleToggle = () => {
    if (isExpanded) {
      setEditingAttribute(null);
    }
    onToggle();
  };

  // Format size display for collapsed view (e.g., "Size 1 - Jumbo")
  const getSizeDisplay = () => {
    if (!product.selectedSize) return null;
    const sizeParts = product.selectedSize.name.split(' ');
    const sizeLabel = `${sizeParts[0]} ${sizeParts[1]}`;
    const packagingLabel = product.selectedPackaging?.name;
    return packagingLabel ? `${sizeLabel} - ${packagingLabel}` : sizeLabel;
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={handleToggle}>
      <div ref={itemRef} className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header - fully clickable to toggle */}
        <CollapsibleTrigger asChild>
          <button 
            type="button" 
            className="flex items-center gap-3 p-3 w-full text-left active:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              {/* Category - Title Case */}
              <h5 className="font-medium text-sm text-foreground capitalize">
                {product.category}
              </h5>
              {/* Product name (brand + product) */}
              <p className="text-xs text-muted-foreground">
                {product.selectedVariant.brand} {product.selectedVariant.name}
              </p>
              {/* Size + Packaging */}
              {product.selectedSize && (
                <p className="text-xs text-muted-foreground">
                  {getSizeDisplay()}
                </p>
              )}
            </div>
            
            {/* Quantity badge */}
            <span className="text-sm font-medium text-muted-foreground">
              x{product.quantity}
            </span>
            
            {/* Arrow icon (decorative, part of the button) */}
            <div className="h-8 w-8 flex items-center justify-center text-muted-foreground">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Expanded content */}
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className="px-3 pb-3 pt-3 space-y-3 border-t border-border">
            {/* Brand attribute */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Brand
                </span>
                <button
                  className="text-xs text-primary font-medium"
                  onClick={() => toggleAttribute('brand')}
                >
                  {editingAttribute === 'brand' ? 'Done' : 'Change'}
                </button>
              </div>

              {editingAttribute === 'brand' ? (
                <div className="animate-fade-in">
                  <div className="flex gap-2 overflow-x-auto pt-1 pb-2 -mx-1 px-1 scrollbar-hide">
                    {variants.map((variant) => {
                      const isSelected = variant.id === product.selectedVariant.id;
                      return (
                        <button
                          key={variant.id}
                          className={cn(
                            "flex-shrink-0 w-24 p-3 rounded-lg border text-center transition-all relative",
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-muted-foreground/50"
                          )}
                          onClick={() => handleVariantSelect(variant)}
                        >
                          <p className="font-semibold text-sm text-foreground">
                            {variant.brand}
                          </p>
                          {isSelected && (
                            <Check className="w-4 h-4 text-primary absolute top-2 right-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-foreground">
                  {product.selectedVariant.brand}
                </p>
              )}
            </div>

            {/* Product attribute */}
            <div className="space-y-1" ref={productScrollRef}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Product
                </span>
                <button
                  className="text-xs text-primary font-medium"
                  onClick={() => toggleAttribute('product')}
                >
                  {editingAttribute === 'product' ? 'Done' : 'Change'}
                </button>
              </div>
              {editingAttribute === 'product' ? (
                <div className="animate-fade-in">
                  <div className="flex gap-2 overflow-x-auto pt-1 pb-2 -mx-1 px-1 scrollbar-hide">
                    {variants.map((variant) => {
                      const isSelected = variant.id === product.selectedVariant.id;
                      return (
                        <button
                          key={variant.id}
                          className={cn(
                            "flex-shrink-0 w-36 rounded-xl border text-left transition-all relative overflow-hidden",
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-muted-foreground/50"
                          )}
                          onClick={() => handleVariantSelect(variant)}
                        >
                          {/* Product image - increased height */}
                          <div className="w-full h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                            <img 
                              src={`https://placehold.co/144x128/f5f3f0/a08b76?text=${encodeURIComponent(variant.brand)}`}
                              alt={variant.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Product info - reduced padding */}
                          <div className="p-2">
                            <p className="font-medium text-xs truncate text-foreground">
                              {variant.name}
                            </p>
                            <p className="text-2xs text-muted-foreground truncate">
                              {variant.brand}
                            </p>
                            <p className="text-2xs text-muted-foreground mt-0.5">
                              {variant.priceDelta > 0
                                ? `+${formatPrice(variant.priceDelta)}`
                                : 'Included'}
                            </p>
                          </div>
                          
                          {/* Selected indicator */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-foreground">
                  {product.selectedVariant.name}
                  {product.selectedVariant.priceDelta > 0 && (
                    <span className="text-muted-foreground ml-1">
                      (+{formatPrice(product.selectedVariant.priceDelta)})
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Size attribute (diapers only) */}
            {showSizes && product.selectedSize && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Size
                  </span>
                  <button
                    className="text-xs text-primary font-medium"
                    onClick={() => toggleAttribute('size')}
                  >
                    {editingAttribute === 'size' ? 'Done' : 'Change'}
                  </button>
                </div>

                {editingAttribute === 'size' ? (
                  <div className="animate-fade-in">
                    <div className="flex gap-2 overflow-x-auto pt-1 pb-2 -mx-1 px-1 scrollbar-hide">
                      {diaperSizes.map((size) => {
                        const isSelected = size.id === product.selectedSize?.id;
                        return (
                          <button
                            key={size.id}
                            className={cn(
                              "flex-shrink-0 w-28 p-3 rounded-lg border text-left transition-all relative",
                              isSelected
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border hover:border-muted-foreground/50"
                            )}
                            onClick={() => handleSizeSelect(size)}
                          >
                            <p className="font-medium text-sm truncate text-foreground">
                              {size.name}
                            </p>
                            {size.weightRange && (
                              <p className="text-xs text-muted-foreground truncate">
                                {size.weightRange}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {size.priceDelta > 0
                                ? `+${formatPrice(size.priceDelta)}`
                                : 'Included'}
                            </p>
                            {isSelected && (
                              <Check className="w-4 h-4 text-primary absolute top-2 right-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground">
                    {product.selectedSize.name}
                    {product.selectedSize.weightRange && (
                      <span className="text-muted-foreground ml-1">
                        ({product.selectedSize.weightRange})
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* Quantity attribute */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Quantity
                </span>
                <span className="text-xs text-muted-foreground">
                  Fixed
                </span>
              </div>
              <p className="text-sm text-foreground">
                {product.quantity}
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
