import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRecentVariants } from "@/hooks/useCatalogue";
import { formatPrice } from "@/data/catalogueData";
import { TYPE_ATTR, SIZE_ATTR } from "@/lib/catalogueAdapter";
import type { RecentVariant } from "@/lib/api";

interface ReorderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Opens the product detail for a recent item (by slug). */
  onProductClick: (slug: string) => void;
}

function attr(v: RecentVariant, name: string) {
  return v.variant.attributes.find((a) => a.attributeName === name);
}

export function ReorderDrawer({ open, onOpenChange, onProductClick }: ReorderDrawerProps) {
  const { addToCart, openCart } = useCart();
  const { session } = useAuth();
  const token = session?.access_token;
  const { data, isLoading } = useRecentVariants(token);
  const variants = data?.variants ?? [];
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());

  const handleReorder = (v: RecentVariant, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (addedKeys.has(key)) return;

    const typeAttr = attr(v, TYPE_ATTR);
    const sizeAttr = attr(v, SIZE_ATTR);

    addToCart(
      {
        variantId: v.variant.id,
        productId: v.productId,
        productName: v.productName,
        brand: v.brand,
        slug: v.slug,
        typeId: typeAttr?.value || "_default",
        typeName: typeAttr?.displayValue || typeAttr?.value || "",
        sizeId: sizeAttr?.value,
        sizeName: sizeAttr?.displayValue || sizeAttr?.value,
        attributes: v.variant.attributes.map((a) => ({
          attributeName: a.attributeName,
          value: a.value,
          displayValue: a.displayValue,
        })),
        unitPrice: v.variant.price,
        image: v.imageUrl,
        isAutoRenew: false,
        subscriptionPrice: v.variant.subscriptionPrice,
        recommendedFrequencyWeeks: v.variant.recommendedFrequencyWeeks,
      },
      1,
    );

    setAddedKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    toast.success("Added to cart", {
      duration: 2500,
      action: { label: "Go to Cart", onClick: () => setTimeout(() => openCart(), 100) },
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left px-4 pb-2">
          <DrawerTitle className="text-lg font-bold">Reorder essentials</DrawerTitle>
          <p className="text-xs text-muted-foreground">
            Quickly add items you've recently bought.
          </p>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6 pt-2 space-y-3">
          {!token ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sign in to see your recent purchases.
            </p>
          ) : isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[88px] bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : variants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              You don't have any recent purchases yet.
            </p>
          ) : (
            variants.map((v) => {
              const typeAttr = attr(v, TYPE_ATTR);
              const sizeAttr = attr(v, SIZE_ATTR);
              const variantLabel = [
                typeAttr?.displayValue || typeAttr?.value,
                sizeAttr?.displayValue || sizeAttr?.value,
              ]
                .filter(Boolean)
                .join(" · ");
              const key = v.variant.id;
              const isAdded = addedKeys.has(key);
              return (
                <button
                  key={key}
                  onClick={() => onProductClick(v.slug)}
                  className="w-full flex items-center gap-3 bg-card rounded-2xl border border-border/40 shadow-soft p-3 active:scale-[0.99] transition-transform text-left"
                >
                  <div className="w-16 h-16 rounded-xl bg-[#F5F3F0] overflow-hidden flex-shrink-0">
                    {v.imageUrl ? (
                      <img src={v.imageUrl} alt={v.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary/70 to-secondary/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {v.brand} {v.productName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{variantLabel}</p>
                    <p className="mt-1 text-sm font-bold text-foreground">{formatPrice(v.variant.price)}</p>
                  </div>
                  <span
                    onClick={(e) => handleReorder(v, key, e)}
                    aria-disabled={isAdded}
                    className={`inline-flex items-center gap-1 px-3 h-9 rounded-full text-xs font-semibold transition-all flex-shrink-0 ${
                      isAdded
                        ? "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none"
                        : "bg-primary text-primary-foreground cursor-pointer active:scale-95"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Added to cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3.5 h-3.5" /> Add to cart
                      </>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
