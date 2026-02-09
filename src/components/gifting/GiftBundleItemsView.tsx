import { useState, useMemo, useEffect, useRef } from "react";
import { ArrowLeft, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityControl } from "@/components/cart/QuantityControl";
import { ProductCard } from "@/components/catalogue/ProductCard";
import { GiftProductSelectDrawer } from "./GiftProductSelectDrawer";
import {
  BundleItem,
  BundleTier,
  Stage,
  formatPrice,
  getPriceForStage,
  bundleCategoryToCatalogueId,
} from "@/data/bundleData";
import {
  CatalogueProduct,
  catalogueProducts,
  getProductsByCategory,
} from "@/data/catalogueData";
import { cn } from "@/lib/utils"; // kept for potential future use

export interface SelectedProduct {
  categoryName: string;
  product: CatalogueProduct;
  selectedTypeId: string;
  selectedSizeId?: string;
  quantity: number;
}

interface GiftBundleItemsViewProps {
  open: boolean;
  onClose: () => void;
  tier: BundleTier;
  stage: Stage;
  contents: BundleItem[];
  onProceed: (items: SelectedProduct[]) => void;
}

function getDefaultProductForCategory(categoryName: string): SelectedProduct | null {
  const catalogueId = bundleCategoryToCatalogueId[categoryName];
  if (!catalogueId) return null;
  const products = getProductsByCategory(catalogueId);
  if (products.length === 0) return null;
  const product = products[0];
  return {
    categoryName,
    product,
    selectedTypeId: product.types[0]?.id || '',
    selectedSizeId: product.sizes?.[0]?.id,
    quantity: 1,
  };
}

export function GiftBundleItemsView({
  open,
  onClose,
  tier,
  stage,
  contents,
  onProceed,
}: GiftBundleItemsViewProps) {
  const [items, setItems] = useState<SelectedProduct[]>(() =>
    contents
      .map(c => getDefaultProductForCategory(c.category))
      .filter((x): x is SelectedProduct => x !== null)
  );

  const [swappingIndex, setSwappingIndex] = useState<number | null>(null);
  const swapRef = useRef<HTMLDivElement>(null);

  // Reset items when bundle changes
  useEffect(() => {
    setItems(
      contents
        .map(c => getDefaultProductForCategory(c.category))
        .filter((x): x is SelectedProduct => x !== null)
    );
    setSwappingIndex(null);
  }, [tier.id, stage.id]);
  const [selectDrawerProduct, setSelectDrawerProduct] = useState<CatalogueProduct | null>(null);
  const [selectDrawerCategoryIndex, setSelectDrawerCategoryIndex] = useState<number | null>(null);

  const totalPrice = useMemo(() => {
    const base = items.reduce((sum, item) => {
      const type = item.product.types.find(t => t.id === item.selectedTypeId);
      const size = item.product.sizes?.find(s => s.id === item.selectedSizeId);
      const unitPrice = (type?.price || 0) + (size?.priceDelta || 0);
      return sum + unitPrice * item.quantity;
    }, 0);
    return getPriceForStage(base, stage.id);
  }, [items, stage.id]);

  const handleQuantityChange = (index: number, quantity: number) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity } : item));
  };

  const handleDelete = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    if (swappingIndex === index) setSwappingIndex(null);
  };

  const handleChangeClick = (index: number) => {
    const newIndex = swappingIndex === index ? null : index;
    setSwappingIndex(newIndex);
    if (newIndex !== null) {
      setTimeout(() => {
        swapRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  };

  const handleCarouselProductClick = (product: CatalogueProduct, index: number) => {
    setSelectDrawerProduct(product);
    setSelectDrawerCategoryIndex(index);
  };

  const handleProductSelected = (
    product: CatalogueProduct,
    typeId: string,
    sizeId?: string
  ) => {
    if (selectDrawerCategoryIndex === null) return;
    setItems(prev =>
      prev.map((item, i) =>
        i === selectDrawerCategoryIndex
          ? { ...item, product, selectedTypeId: typeId, selectedSizeId: sizeId }
          : item
      )
    );
    setSelectDrawerProduct(null);
    setSelectDrawerCategoryIndex(null);
    setSwappingIndex(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b shrink-0">
        <button type="button" onClick={onClose}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="font-semibold text-lg">{tier.name}</h1>
          <p className="text-sm text-muted-foreground">{stage.name} · {stage.ageRange}</p>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 space-y-3">
            {items.map((item, index) => {
              const type = item.product.types.find(t => t.id === item.selectedTypeId);
              const size = item.product.sizes?.find(s => s.id === item.selectedSizeId);
              const unitPrice = (type?.price || 0) + (size?.priceDelta || 0);
              const isSwapping = swappingIndex === index;
              const catalogueId = bundleCategoryToCatalogueId[item.categoryName];
              const categoryProducts = catalogueId ? getProductsByCategory(catalogueId) : [];

              return (
                <div key={`${item.categoryName}-${index}`} ref={isSwapping ? swapRef : undefined}>
                  {isSwapping && categoryProducts.length > 0 ? (
                    /* Swap carousel replaces the card */
                    <div className="rounded-xl border border-border bg-card p-3 animate-fade-in">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-foreground">{item.categoryName}</p>
                        <button
                          onClick={() => setSwappingIndex(null)}
                          className="text-sm text-muted-foreground font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="flex gap-3 overflow-x-auto flex-nowrap snap-x snap-mandatory overscroll-x-contain touch-pan-x pb-2 scrollbar-hide relative z-10">
                        {categoryProducts.map(p => (
                          <div key={p.id} className="flex-shrink-0 snap-start pointer-events-auto">
                            <ProductCard
                              product={p}
                              onClick={() => handleCarouselProductClick(p, index)}
                              size="small"
                            />
                          </div>
                        ))}
                        <div className="w-4 flex-shrink-0" />
                      </div>
                    </div>
                  ) : (
                    /* Product card */
                    <div className="rounded-xl border border-border bg-card p-3">
                      <div className="flex gap-3">
                        {/* Image */}
                        <div className="w-16 h-16 rounded-lg bg-secondary/50 overflow-hidden flex-shrink-0">
                          {item.product.image ? (
                            <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-secondary/80 to-secondary/30" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">{item.categoryName}</p>
                              <h4 className="font-medium text-foreground text-sm leading-tight truncate">
                                {item.product.brand} {item.product.name}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {type?.name}{size ? ` · ${size.name}` : ''}
                              </p>
                            </div>
                            <button
                              onClick={() => handleChangeClick(index)}
                              className="text-sm text-primary font-medium shrink-0 ml-2"
                            >
                              <RefreshCw className="w-4 h-4 inline mr-1" />
                              Change
                            </button>
                          </div>

                          {/* Price + controls */}
                          <p className="text-sm font-semibold text-foreground mt-1">
                            {formatPrice(unitPrice)}
                          </p>
                          <div className="flex items-center justify-between mt-1.5">
                            <QuantityControl
                              value={item.quantity}
                              onChange={(q) => handleQuantityChange(index, q)}
                              size="sm"
                            />
                            <button
                              onClick={() => handleDelete(index)}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {items.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No items in bundle</p>
              </div>
            )}
          </div>
      </div>

      {/* Footer */}
      <div className="p-4 pb-6 border-t bg-background shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="text-xl font-bold text-foreground">{formatPrice(totalPrice)}</span>
        </div>
        <Button
          variant="shop"
          className="w-full h-12 text-base font-semibold"
          onClick={() => onProceed(items)}
          disabled={items.length === 0}
        >
          Checkout
        </Button>
      </div>

      {/* Product select drawer */}
      <GiftProductSelectDrawer
        open={!!selectDrawerProduct}
        onOpenChange={(open) => { if (!open) { setSelectDrawerProduct(null); setSelectDrawerCategoryIndex(null); } }}
        product={selectDrawerProduct}
        onSelect={handleProductSelected}
      />
    </div>
  );
}
