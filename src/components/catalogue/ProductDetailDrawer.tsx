import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CatalogueProduct, formatPrice as formatPriceOld } from "@/data/catalogueData";
import { api, ProductDetail, formatPrice as formatPriceAPI } from "@/lib/api";
import { CloudinaryPresets } from "@/lib/cloudinary";
import { QuantityControl } from "@/components/cart/QuantityControl";
import { useCart } from "@/contexts/CartContext";

interface ProductDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: CatalogueProduct | null;
  productSlug?: string | null;
  mode?: 'cart' | 'select';
  onSelect?: (variant: any, quantity: number) => void;
}

export function ProductDetailDrawer({ open, onOpenChange, product, productSlug, mode = 'cart', onSelect }: ProductDetailDrawerProps) {
  const { addToCart } = useCart();

  // Fetch API product if slug is provided
  const { data: apiProduct, isLoading } = useQuery({
    queryKey: ['product', productSlug],
    queryFn: () => api.getProduct(productSlug!),
    enabled: !!productSlug && open,
  });

  // State for old product type
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);

  // State for API product type (attribute-based selection)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  const [quantity, setQuantity] = useState(1);

  // Get ordered list of attribute names (determines hierarchy for filtering)
  const attributeOrder = useMemo(() =>
    Object.keys(apiProduct?.availableAttributes || {}),
    [apiProduct]
  );

  // Helper: Check if an attribute value is available given current selections
  // Uses hierarchical filtering - only checks attributes ABOVE current one in hierarchy
  const isAttributeValueAvailable = useCallback((
    attrName: string,
    attrValue: string,
    currentSelections: Record<string, string>,
    variants: ProductVariant[],
    attributeOrder: string[]
  ): boolean => {
    // Get index of current attribute in hierarchy
    const currentIndex = attributeOrder.indexOf(attrName);

    // Build test selections including only attributes ABOVE current one
    const testSelections: Record<string, string> = {};

    // Include selections from higher-level attributes only
    attributeOrder.forEach((attr, index) => {
      if (index < currentIndex && currentSelections[attr]) {
        testSelections[attr] = currentSelections[attr];
      }
    });

    // Include the test value for current attribute
    testSelections[attrName] = attrValue;

    // Check if any variant matches these selections
    return variants.some(variant =>
      Object.entries(testSelections).every(([key, value]) =>
        variant.attributes.some(attr =>
          attr.attributeName === key && attr.value === value
        )
      )
    );
  }, []);

  // Find matching variant for API product based on selected attributes
  const matchedVariant = useMemo(() => {
    if (!apiProduct) return null;

    return apiProduct.variants.find(variant =>
      variant.attributes.every(attr =>
        selectedAttributes[attr.attributeName] === attr.value
      )
    );
  }, [apiProduct, selectedAttributes]);

  // Calculate current unit price based on selections
  const unitPrice = useMemo(() => {
    // API product - use matched variant price
    if (apiProduct && matchedVariant) {
      return matchedVariant.price;
    }

    // Old product - legacy price calculation
    if (!product || !selectedTypeId) return null;
    const type = product.types.find(t => t.id === selectedTypeId);
    if (!type) return null;

    let price = type.price;
    if (product.sizes && selectedSizeId) {
      const size = product.sizes.find(s => s.id === selectedSizeId);
      if (size) price += size.priceDelta;
    }
    return price;
  }, [apiProduct, matchedVariant, product, selectedTypeId, selectedSizeId]);

  // Calculate total price (unit price × quantity)
  const totalPrice = useMemo(() => {
    if (!unitPrice) return null;
    return unitPrice * quantity;
  }, [unitPrice, quantity]);

  // Handle attribute change with cascading auto-selection
  const handleAttributeChange = useCallback((attrName: string, attrValue: string) => {
    if (!apiProduct) return;

    setSelectedAttributes(prev => {
      const newSelections = { ...prev, [attrName]: attrValue };

      // Check if current selections for lower attributes are still valid
      const attrIndex = attributeOrder.indexOf(attrName);
      attributeOrder.forEach((lowerAttr, index) => {
        if (index > attrIndex) {
          // Check if current value is still available
          const currentValue = newSelections[lowerAttr];
          const isStillAvailable = currentValue && isAttributeValueAvailable(
            lowerAttr,
            currentValue,
            newSelections,
            apiProduct.variants,
            attributeOrder
          );

          if (!isStillAvailable) {
            // Find first available option
            const availableValues = apiProduct.availableAttributes[lowerAttr] || [];
            const firstAvailable = availableValues.find(val =>
              isAttributeValueAvailable(lowerAttr, val, newSelections, apiProduct.variants, attributeOrder)
            );

            if (firstAvailable) {
              newSelections[lowerAttr] = firstAvailable;
            }
          }
        }
      });

      return newSelections;
    });
  }, [apiProduct, attributeOrder, isAttributeValueAvailable]);

  // Helper: Get display value for an attribute value
  const getDisplayValue = useCallback((attrName: string, attrValue: string): string => {
    if (!apiProduct) return attrValue;

    // Find a variant that has this attribute value
    const variantWithAttr = apiProduct.variants.find(variant =>
      variant.attributes.some(attr =>
        attr.attributeName === attrName && attr.value === attrValue
      )
    );

    if (variantWithAttr) {
      const attr = variantWithAttr.attributes.find(
        a => a.attributeName === attrName && a.value === attrValue
      );
      return attr?.displayValue || attrValue;
    }

    return attrValue;
  }, [apiProduct]);

  // Reset selections when product changes
  useEffect(() => {
    if (product) {
      // Old product type
      setSelectedTypeId(product.types[0]?.id || null);
      setSelectedSizeId(product.sizes?.[0]?.id || null);
      setQuantity(1);
    } else if (apiProduct) {
      // API product type - initialize with first value of each attribute
      const initialAttributes: Record<string, string> = {};
      Object.entries(apiProduct.availableAttributes).forEach(([attrName, values]) => {
        if (values.length > 0) {
          initialAttributes[attrName] = values[0];
        }
      });
      setSelectedAttributes(initialAttributes);
      setQuantity(1);
    }
  }, [product, apiProduct]);

  const handleAddToCart = () => {
    if (!unitPrice) return;

    // API product - use variant
    if (apiProduct && matchedVariant) {
      // If in select mode, call onSelect callback instead of adding to cart
      if (mode === 'select' && onSelect) {
        // Enrich variant with product info for the callback
        onSelect({
          ...matchedVariant,
          product: {
            id: apiProduct.id,
            name: apiProduct.name,
            brand: apiProduct.brand,
            slug: apiProduct.slug,
          }
        }, quantity);
        onOpenChange(false);
        return;
      }

      // Default cart mode
      addToCart({
        variantId: matchedVariant.id,
        productId: apiProduct.id,
        productName: apiProduct.name,
        brand: apiProduct.brand,
        slug: apiProduct.slug,
        // Legacy fields for compatibility
        typeId: matchedVariant.id,
        typeName: matchedVariant.sku,
        // New fields
        attributes: matchedVariant.attributes.map(attr => ({
          attributeName: attr.attributeName,
          value: attr.value,
          displayValue: attr.displayValue,
        })),
        unitPrice,
        image: apiProduct.imageUrl || matchedVariant.imageUrl,
      }, quantity);

      onOpenChange(false);
      return;
    }

    // Old product type
    if (!product || !selectedTypeId) return;

    const selectedType = product.types.find(t => t.id === selectedTypeId);
    const selectedSize = product.sizes?.find(s => s.id === selectedSizeId);

    // If in select mode (only applies to API products, but keep for consistency)
    if (mode === 'select' && onSelect) {
      // For old products, we don't have a proper variant structure
      // This shouldn't happen in practice as select mode is for API products only
      onOpenChange(false);
      return;
    }

    addToCart({
      variantId: `${product.id}-${selectedTypeId}-${selectedSizeId || 'none'}`,
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      slug: product.id,
      typeId: selectedTypeId,
      typeName: selectedType?.name || '',
      sizeId: selectedSizeId || undefined,
      sizeName: selectedSize?.name,
      unitPrice,
      image: product.image,
    }, quantity);

    onOpenChange(false);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading product...</div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Determine which product to render
  const displayProduct = apiProduct || product;
  const formatPrice = apiProduct ? formatPriceAPI : formatPriceOld;
  const imageUrl = apiProduct
    ? (matchedVariant?.imageUrl || apiProduct.imageUrl)
    : product?.image;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        {displayProduct && (
          <div className="flex flex-col max-h-[85vh]">
            <div className="flex-1 overflow-y-auto animate-fade-in">
              {/* Large product image */}
              <div className="px-6 pt-2">
                <div className="aspect-square rounded-2xl bg-secondary/50 overflow-hidden max-w-[140px] mx-auto">
                  {imageUrl ? (
                    <img src={CloudinaryPresets.detail(imageUrl)} alt={displayProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-secondary/80 to-secondary/30" />
                  )}
                </div>
              </div>

              {/* Product name and description */}
              <div className="px-6 pt-4 text-center">
                <h2 className="text-xl font-bold text-foreground">
                  {displayProduct.brand} {displayProduct.name}
                </h2>
                {apiProduct && apiProduct.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {apiProduct.description}
                  </p>
                )}
                {product && (() => {
                  const type = product.types.find(t => t.id === selectedTypeId);
                  const size = product.sizes?.find(s => s.id === selectedSizeId);
                  const desc = size?.description || type?.description;
                  return desc ? (
                    <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                  ) : null;
                })()}
              </div>
              
              {/* API Product - Attribute selectors */}
              {apiProduct && Object.entries(apiProduct.availableAttributes).map(([attrName, values]) => (
                <div key={attrName} className="px-6 pt-4">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    {attrName}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {values.map(value => {
                      const isAvailable = isAttributeValueAvailable(
                        attrName,
                        value,
                        selectedAttributes,
                        apiProduct.variants,
                        attributeOrder
                      );
                      const isSelected = selectedAttributes[attrName] === value;

                      return (
                        <button
                          key={value}
                          onClick={() => isAvailable && handleAttributeChange(attrName, value)}
                          disabled={!isAvailable}
                          className={cn(
                            "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : isAvailable
                                ? "border-border hover:border-primary/50"
                                : "border-border/50 bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
                          )}
                        >
                          {getDisplayValue(attrName, value)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Old Product - Type selector */}
              {product && (
                <div className="px-6 pt-4">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Type
                  </label>
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
              )}

              {/* Old Product - Size selector (only for products with sizes) */}
              {product && product.sizes && product.sizes.length > 0 && (
                <div className="px-6 pt-4">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Size
                  </label>
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

              {/* Quantity and Total */}
              <div className="px-6 pt-4">
                <div className="border-t border-border pt-4">
                  {/* Quantity Row */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-muted-foreground">Quantity</span>
                    <QuantityControl value={quantity} onChange={setQuantity} />
                  </div>

                  {/* Total Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-xl font-bold text-foreground">
                      {totalPrice ? formatPrice(totalPrice) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Add to Cart / Select Button - pinned */}
            <div className="px-6 py-6 shrink-0">
              <Button
                variant="shop"
                className="w-full h-12 rounded-xl"
                onClick={handleAddToCart}
                disabled={!unitPrice}
              >
                {mode === 'select' ? 'Select' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}