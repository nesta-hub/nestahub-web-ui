import { useState, useMemo, useEffect } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CatalogueProduct, formatPrice } from "@/data/catalogueData";

interface GiftProductSelectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: CatalogueProduct | null;
  onSelect: (product: CatalogueProduct, typeId: string, sizeId?: string) => void;
}

export function GiftProductSelectDrawer({
  open,
  onOpenChange,
  product,
  onSelect,
}: GiftProductSelectDrawerProps) {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setSelectedTypeId(product.types[0]?.id || null);
      setSelectedSizeId(product.sizes?.[0]?.id || null);
    }
  }, [product]);

  const unitPrice = useMemo(() => {
    if (!product || !selectedTypeId) return null;
    const type = product.types.find(t => t.id === selectedTypeId);
    if (!type) return null;
    let price = type.price;
    if (product.sizes && selectedSizeId) {
      const size = product.sizes.find(s => s.id === selectedSizeId);
      if (size) price += size.priceDelta;
    }
    return price;
  }, [product, selectedTypeId, selectedSizeId]);

  const handleSelect = () => {
    if (!product || !selectedTypeId) return;
    onSelect(product, selectedTypeId, selectedSizeId || undefined);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        {product && (
          <div className="animate-fade-in">
            {/* Product image */}
            <div className="px-6 pt-2">
              <div className="aspect-square rounded-2xl bg-secondary/50 overflow-hidden max-w-[140px] mx-auto">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-secondary/80 to-secondary/30" />
                )}
              </div>
            </div>

            {/* Name */}
            <div className="px-6 pt-4 text-center">
              <h2 className="text-xl font-bold text-foreground">
                {product.brand} {product.name}
              </h2>
              {(() => {
                const type = product.types.find(t => t.id === selectedTypeId);
                const size = product.sizes?.find(s => s.id === selectedSizeId);
                const desc = size?.description || type?.description;
                return desc ? (
                  <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                ) : null;
              })()}
            </div>

            {/* Type selector */}
            <div className="px-6 pt-4">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Type</label>
              <div className="flex flex-wrap gap-2">
                {product.types.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedTypeId(type.id)}
                    className={cn(
                      "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                      selectedTypeId === type.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Size selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="px-6 pt-4">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Size</label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSizeId(size.id)}
                      className={cn(
                        "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                        selectedSizeId === size.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="px-6 pt-4">
              <div className="border-t border-border pt-4 flex items-center justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="text-xl font-bold text-foreground">
                  {unitPrice ? formatPrice(unitPrice) : '—'}
                </span>
              </div>
            </div>

            {/* Select CTA */}
            <div className="px-6 py-6">
              <Button
                variant="shop"
                className="w-full h-12 rounded-xl"
                onClick={handleSelect}
                disabled={!unitPrice}
              >
                Select
              </Button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
