import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityControl } from "@/components/cart/QuantityControl";
import { api, type BundleCategoryProduct, type ProductVariant } from "@/lib/api";
import type { CartItem } from "@/contexts/CartContext";
import { ProductDetailDrawer } from "@/components/catalogue/ProductDetailDrawer";

// Helper to format price from kobo
const formatPrice = (priceInKobo: number) => {
  const naira = priceInKobo / 100;
  return `₦${naira.toLocaleString()}`;
};

export interface SelectedProduct {
  categoryId: string;
  categoryName: string;
  bundleCategoryProductId: string;
  variantId: string;
  variant: {
    id: string;
    sku: string;
    price: number;
    imageUrl?: string;
    product: {
      id: string;
      name: string;
      brand: string;
      slug: string;
    };
    attributes: Array<{
      attributeName: string;
      value: string;
      displayValue: string;
    }>;
  };
  quantity: number;
}

interface GiftBundleItemsViewProps {
  open: boolean;
  onClose: () => void;
  bundleId: string;
  ageGroupSlug: string;
  onProceed: (items: SelectedProduct[]) => void;
}

// Convert API variant to cart item format
function convertToCartItem(item: SelectedProduct): Omit<CartItem, 'quantity'> {
  return {
    variantId: item.variant.id,
    productId: item.variant.product.id,
    productName: item.variant.product.name,
    brand: item.variant.product.brand,
    slug: item.variant.product.slug,
    // Legacy fields for backwards compatibility
    typeId: item.variant.id,
    typeName: item.categoryName,
    sizeId: undefined,
    sizeName: undefined,
    // API fields
    attributes: item.variant.attributes,
    unitPrice: item.variant.price,
    image: item.variant.imageUrl,
  };
}

export function GiftBundleItemsView({
  open,
  onClose,
  bundleId,
  ageGroupSlug,
  onProceed,
}: GiftBundleItemsViewProps) {
  // Fetch bundle details by ID instead of slug
  const { data: bundleData, isLoading: bundleLoading } = useQuery({
    queryKey: ['bundle', bundleId],
    queryFn: () => api.getBundle(bundleId),
    enabled: open && !!bundleId,
  });

  const [items, setItems] = useState<SelectedProduct[]>([]);
  const [swappingIndex, setSwappingIndex] = useState<number | null>(null);
  const [swappingCategoryId, setSwappingCategoryId] = useState<string | null>(null);
  const swapRef = useRef<HTMLDivElement>(null);

  // State for product detail drawer (for swapping)
  const [selectDrawerOpen, setSelectDrawerOpen] = useState(false);
  const [selectProductSlug, setSelectProductSlug] = useState<string | null>(null);

  // Fetch category products when swapping
  const { data: categoryProductsData } = useQuery({
    queryKey: ['categoryProducts', swappingCategoryId],
    queryFn: () => swappingCategoryId ? api.getCategoryProducts(swappingCategoryId) : Promise.reject(),
    enabled: !!swappingCategoryId && swappingIndex !== null,
  });

  // Initialize items from bundle data
  useEffect(() => {
    // Extract categories from the first bundleAgeGroup (since we're viewing one age group)
    const categories = bundleData?.bundleAgeGroups?.[0]?.categories;

    if (categories && open) {
      const initialItems: SelectedProduct[] = [];

      categories.forEach((category) => {
        category.products.forEach((product) => {
          initialItems.push({
            categoryId: category.categoryId,
            categoryName: category.category.name, // Use internal name instead of display name
            bundleCategoryProductId: product.id,
            variantId: product.variantId,
            variant: {
              id: product.variant.id,
              sku: product.variant.sku,
              price: product.variant.price,
              imageUrl: product.variant.imageUrl,
              product: {
                id: product.variant.product.id,
                name: product.variant.product.name,
                brand: product.variant.product.brand,
                slug: product.variant.product.slug,
              },
              attributes: product.variant.attributes.map(attr => ({
                attributeName: attr.attributeName,
                value: attr.value,
                displayValue: attr.displayValue,
              })),
            },
            quantity: product.quantity,
          });
        });
      });

      setItems(initialItems);
      setSwappingIndex(null);
    }
  }, [bundleData, open]);

  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + item.variant.price * item.quantity;
    }, 0);
  }, [items]);

  const handleQuantityChange = (index: number, quantity: number) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity } : item));
  };

  const handleDelete = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    if (swappingIndex === index) {
      setSwappingIndex(null);
      setSwappingCategoryId(null);
    }
  };

  const handleChangeClick = (index: number) => {
    const item = items[index];
    const newIndex = swappingIndex === index ? null : index;
    setSwappingIndex(newIndex);
    setSwappingCategoryId(newIndex !== null ? item.categoryId : null);

    if (newIndex !== null) {
      setTimeout(() => {
        swapRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  };

  const handleProductClick = (productSlug: string) => {
    setSelectProductSlug(productSlug);
    setSelectDrawerOpen(true);
  };

  const handleVariantSelected = (variant: any, quantity: number) => {
    if (swappingIndex === null) return;

    setItems(prev =>
      prev.map((item, i) =>
        i === swappingIndex
          ? {
              ...item,
              variantId: variant.id,
              variant: {
                id: variant.id,
                sku: variant.sku,
                price: variant.price,
                imageUrl: variant.imageUrl,
                product: variant.product,
                attributes: variant.attributes.map((attr: any) => ({
                  attributeName: attr.attributeName,
                  value: attr.value,
                  displayValue: attr.displayValue,
                })),
              },
              quantity, // Update quantity from drawer selection
            }
          : item
      )
    );

    setSwappingIndex(null);
    setSwappingCategoryId(null);
    setSelectDrawerOpen(false);
    setSelectProductSlug(null);
  };

  if (!open) return null;

  // Loading state
  if (bundleLoading) {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b shrink-0">
        <button type="button" onClick={onClose}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="font-semibold text-lg">{bundleData?.name || 'Gift Bundle'}</h1>
          <p className="text-sm text-muted-foreground">{ageGroupSlug}</p>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 space-y-3">
            {items.map((item, index) => {
              const unitPrice = item.variant.price;
              const isSwapping = swappingIndex === index;
              const categoryProducts = isSwapping && categoryProductsData ? categoryProductsData.products : [];

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
                        {categoryProducts.map(product => (
                          <button
                            key={product.id}
                            onClick={() => handleProductClick(product.slug)}
                            className="flex-shrink-0 snap-start w-32 text-left transition-all active:scale-[0.98]"
                          >
                            {/* Image */}
                            <div className="aspect-square rounded-xl bg-secondary/50 mb-2 overflow-hidden">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-secondary/80 to-secondary/30" />
                              )}
                            </div>
                            {/* Product name */}
                            <p className="font-medium text-foreground truncate text-sm">
                              {product.brand} {product.name}
                            </p>
                            {/* Price */}
                            <p className="text-muted-foreground text-xs">
                              {product.minPrice === product.maxPrice
                                ? formatPrice(product.minPrice)
                                : `from ${formatPrice(product.minPrice)}`
                              }
                            </p>
                          </button>
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
                          {item.variant.imageUrl ? (
                            <img src={item.variant.imageUrl} alt={item.variant.product.name} className="w-full h-full object-cover" />
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
                                {item.variant.product.brand} {item.variant.product.name}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {item.variant.attributes.map(attr => attr.displayValue).join(' · ')}
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

      {/* Product Detail Drawer for selecting variant */}
      <ProductDetailDrawer
        open={selectDrawerOpen}
        onOpenChange={setSelectDrawerOpen}
        productSlug={selectProductSlug}
        mode="select"
        onSelect={handleVariantSelected}
      />
    </div>
  );
}
