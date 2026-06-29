import { useState, useMemo, useEffect, useRef } from "react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { ProductCard } from "./ProductCard";
import { SubcategoryChips } from "./SubcategoryChips";
import { ProductDetailContent } from "./ProductDetailContent";
import { useCategoryProducts } from "@/hooks/useCatalogue";
import { apiCardToCatalogue } from "@/lib/catalogueAdapter";
import type { CatalogueSubcategory } from "@/data/catalogueData";

/** Category identity passed to the drawer (sourced from the tree). */
export interface DrawerCategory {
  id: string;
  slug: string;
  displayName: string;
  subcategories: CatalogueSubcategory[];
}

interface CategoryProductsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: DrawerCategory | null;
  onViewAll?: (category: DrawerCategory) => void;
}

export function CategoryProductsDrawer({
  open,
  onOpenChange,
  category,
  onViewAll,
}: CategoryProductsDrawerProps) {
  const [activeSub, setActiveSub] = useState("all");
  const [selectedProductKey, setSelectedProductKey] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const savedScrollRef = useRef<number>(0);

  // Reset when drawer opens / category changes
  useEffect(() => {
    if (open) {
      setActiveSub("all");
      setSelectedProductKey(null);
      savedScrollRef.current = 0;
    }
  }, [open, category?.id]);

  const { data, isLoading } = useCategoryProducts({
    category: activeSub === "all" ? category?.slug : undefined,
    subcategory: activeSub === "all" ? undefined : activeSub,
    enabled: open && !!category,
  });

  const filtered = useMemo(
    () => (data?.products ?? []).map((p) => ({ raw: p, mapped: apiCardToCatalogue(p) })),
    [data],
  );

  const subcategories = category?.subcategories ?? [];

  // Restore carousel scroll when returning from product view
  useEffect(() => {
    if (!selectedProductKey && carouselRef.current) {
      carouselRef.current.scrollLeft = savedScrollRef.current;
    }
  }, [selectedProductKey]);

  if (!category) return null;

  const mode: "browse" | "product" = selectedProductKey ? "product" : "browse";

  const handleProductTap = (productKey: string) => {
    if (carouselRef.current) savedScrollRef.current = carouselRef.current.scrollLeft;
    setSelectedProductKey(productKey);
  };

  const handleBack = () => setSelectedProductKey(null);

  const handleViewAll = () => {
    onOpenChange(false);
    if (onViewAll) {
      setTimeout(() => onViewAll(category), 150);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent
        aria-describedby={undefined}
        className={
          mode === "product"
            ? "max-h-[92vh] transition-[height] duration-300 ease-out"
            : "max-h-[70vh] transition-[height] duration-300 ease-out"
        }
      >
        <VisuallyHidden.Root>
          <DrawerTitle>{category.displayName}</DrawerTitle>
        </VisuallyHidden.Root>
        <div className="flex flex-col">
          {/* Header (browse mode only) */}
          {mode === "browse" && (
            <div className="px-4 pt-2 pb-2 flex items-center justify-between border-b border-border/40">
              <h2 className="text-base font-bold text-foreground">{category.displayName}</h2>
              <button
                onClick={handleViewAll}
                className="text-sm font-semibold text-primary hover:underline px-2 py-1"
              >
                View all
              </button>
            </div>
          )}

          {/* Body */}
          {mode === "browse" ? (
            <div className="flex flex-col">
              {subcategories.length > 0 && (
                <div className="pt-3">
                  <SubcategoryChips
                    subcategories={subcategories}
                    activeId={activeSub}
                    onChange={setActiveSub}
                  />
                </div>
              )}
              <div
                ref={carouselRef}
                className="overflow-x-auto overflow-y-hidden scrollbar-hide"
              >
                {isLoading ? (
                  <div className="flex gap-3 px-4 pt-3 pb-8">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-36 h-48 shrink-0 bg-muted rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-10 px-6">
                    <p className="text-sm text-muted-foreground">No products in this filter</p>
                  </div>
                ) : (
                  <div className="flex gap-3 px-4 pt-3 pb-8">
                    {filtered.map(({ raw, mapped }, i) => (
                      <div
                        key={raw.id}
                        className="w-36 shrink-0 animate-fade-in"
                        style={{ animationDelay: `${i * 25}ms` }}
                      >
                        <ProductCard
                          product={mapped}
                          size="large"
                          onClick={() => handleProductTap(raw.slug)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              {selectedProductKey && (
                <ProductDetailContent
                  productKey={selectedProductKey}
                  onAdded={() => onOpenChange(false)}
                  fitContent
                  onBack={handleBack}
                />
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
