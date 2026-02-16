import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CatalogueProduct, formatPrice as formatPriceOld } from "@/data/catalogueData";
import { api, ProductDetail, formatPrice as formatPriceAPI } from "@/lib/api";
import { CloudinaryPresets } from "@/lib/cloudinary";
import { QuantityControl } from "@/components/cart/QuantityControl";
import { useCart, calculateSubscriptionPrice } from "@/contexts/CartContext";
import { Check, RefreshCw, ChevronRight } from "lucide-react";

interface ProductDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: CatalogueProduct | null;
  productSlug?: string | null;
  mode?: 'cart' | 'select';
  onSelect?: (variant: any, quantity: number) => void;
}

type DrawerStep = "configure" | "details" | "purchase-type";

const BASE_FREQUENCY_OPTIONS = [
  { weeks: 1, label: "1 week" },
  { weeks: 2, label: "2 weeks" },
  { weeks: 3, label: "3 weeks" },
  { weeks: 4, label: "4 weeks" },
  { weeks: 6, label: "6 weeks" },
  { weeks: 8, label: "8 weeks" },
];

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

  // Subscription state
  const [step, setStep] = useState<DrawerStep>("configure");
  const [purchaseType, setPurchaseType] = useState<"one-time" | "subscribe">("one-time");
  const [frequencyWeeks, setFrequencyWeeks] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const frequencyScrollRef = useRef<HTMLDivElement>(null);
  const [capturedHeight, setCapturedHeight] = useState<number | null>(null);

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

  // Calculate subscription price (custom variant price or regular price)
  const subscriptionTotal = useMemo(() => {
    if (!totalPrice) return null;
    // Use custom subscription price if available (already in kobo, multiply by quantity)
    if (apiProduct && matchedVariant?.subscriptionPrice) {
      return matchedVariant.subscriptionPrice * quantity;
    }
    // Otherwise use regular price
    return totalPrice;
  }, [totalPrice, apiProduct, matchedVariant, quantity]);

  // Get description text from product
  const descriptionText = useMemo(() => {
    // For API products, use variant description
    if (apiProduct && matchedVariant?.description) {
      return matchedVariant.description;
    }
    // For old products, use type/size description
    if (!product || !selectedTypeId) return null;
    const type = product.types.find((t) => t.id === selectedTypeId);
    const size = product.sizes?.find((s) => s.id === selectedSizeId);
    return size?.description || type?.description || null;
  }, [apiProduct, matchedVariant, product, selectedTypeId, selectedSizeId]);

  // Build attribute summary for display
  const attributeSummary = useMemo(() => {
    // For API products, show selected attributes
    if (apiProduct && Object.keys(selectedAttributes).length > 0) {
      return Object.entries(selectedAttributes)
        .map(([_, value]) => value)
        .join(" · ");
    }
    // For old products, show type and size
    if (product && selectedTypeId) {
      const type = product.types.find((t) => t.id === selectedTypeId);
      const size = product.sizes?.find((s) => s.id === selectedSizeId);
      const parts = [type?.name];
      if (size) parts.push(size.name);
      return parts.filter(Boolean).join(" · ");
    }
    return "";
  }, [apiProduct, selectedAttributes, product, selectedTypeId, selectedSizeId]);

  // Build selected summary (used in purchase-type step)
  const selectedSummary = useMemo(() => {
    return attributeSummary ? `${attributeSummary} · Qty: ${quantity}` : "";
  }, [attributeSummary, quantity]);

  // Build frequency options with recommended marker
  const frequencyOptions = useMemo(() => {
    const recommendedWeeks = matchedVariant?.recommendedFrequencyWeeks;
    return BASE_FREQUENCY_OPTIONS.map(opt => ({
      ...opt,
      recommended: recommendedWeeks ? opt.weeks === recommendedWeeks : opt.weeks === 1,
    }));
  }, [matchedVariant]);

  // Check if we're in purchase-type step
  const isPurchaseStep = step === "purchase-type";

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
      setStep("configure");
      setPurchaseType("one-time");
      setFrequencyWeeks(1);
      setCapturedHeight(null);
    } else if (apiProduct) {
      // API product type - initialize with first value of each attribute
      const initialAttributes: Record<string, string> = {};
      Object.entries(apiProduct.availableAttributes).forEach(([attrName, values]) => {
        if (values.length > 0) {
          initialAttributes[attrName] = values[0];
        }
      });
      setSelectedAttributes(initialAttributes);

      // Find the first variant to get recommended frequency
      const firstVariant = apiProduct.variants.find(v =>
        Object.entries(initialAttributes).every(([attrName, attrValue]) =>
          v.attributes.some(attr => attr.attributeName === attrName && attr.value === attrValue)
        )
      );

      setQuantity(1);
      setStep("configure");
      setPurchaseType("one-time");
      setFrequencyWeeks(firstVariant?.recommendedFrequencyWeeks || 1);
      setCapturedHeight(null);
    }
  }, [product, apiProduct]);

  // Update frequency when variant changes (if variant has recommended frequency)
  useEffect(() => {
    if (apiProduct && matchedVariant?.recommendedFrequencyWeeks && purchaseType === "subscribe") {
      setFrequencyWeeks(matchedVariant.recommendedFrequencyWeeks);
    }
  }, [matchedVariant, apiProduct, purchaseType]);

  // Scroll recommended frequency into view (center)
  useEffect(() => {
    if (purchaseType === "subscribe" && frequencyScrollRef.current && step === "purchase-type") {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        const container = frequencyScrollRef.current;
        if (!container) return;

        const selectedButton = container.querySelector(`[data-frequency="${frequencyWeeks}"]`);
        if (selectedButton) {
          selectedButton.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
        }
      }, 100);
    }
  }, [frequencyWeeks, purchaseType, step]);

  useEffect(() => {
    if (!open) {
      setStep("configure");
      setPurchaseType("one-time");
      setCapturedHeight(null);
    }
  }, [open]);

  const handleAddToCartClick = () => {
    if (step === "details") {
      setStep("purchase-type");
    } else {
      setStep("purchase-type");
    }
  };

  const finalizeAddToCart = () => {
    if (!unitPrice) return;

    const isSubscribe = purchaseType === "subscribe";

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
        // Reset state
        setStep("configure");
        setPurchaseType("one-time");
        setFrequencyWeeks(1);
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
        // Subscription fields
        isAutoRenew: isSubscribe,
        frequencyWeeks: isSubscribe ? frequencyWeeks : undefined,
        subscriptionPrice: matchedVariant.subscriptionPrice,
        recommendedFrequencyWeeks: matchedVariant.recommendedFrequencyWeeks,
      }, quantity);

      onOpenChange(false);
      // Reset state
      setStep("configure");
      setPurchaseType("one-time");
      setFrequencyWeeks(1);
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
      // Reset state
      setStep("configure");
      setPurchaseType("one-time");
      setFrequencyWeeks(1);
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
      // Subscription fields
      isAutoRenew: isSubscribe,
      frequencyWeeks: isSubscribe ? frequencyWeeks : undefined,
    }, quantity);

    onOpenChange(false);
    // Reset state
    setStep("configure");
    setPurchaseType("one-time");
    setFrequencyWeeks(1);
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
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto"
              style={step === "details" && capturedHeight ? { minHeight: capturedHeight } : undefined}
            >
              {/* Product image */}
              <div className="px-6 pt-2">
                <div
                  className={cn(
                    "aspect-square rounded-2xl bg-secondary/50 overflow-hidden mx-auto transition-all duration-300",
                    isPurchaseStep ? "max-w-[80px]" : "max-w-[140px]",
                  )}
                >
                  {imageUrl ? (
                    <img src={CloudinaryPresets.detail(imageUrl)} alt={displayProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-secondary/80 to-secondary/30" />
                  )}
                </div>
              </div>

              {/* Product name + view details link */}
              <div className="px-6 pt-3 text-center">
                <h2
                  className={cn(
                    "font-bold text-foreground transition-all duration-300",
                    isPurchaseStep ? "text-base" : "text-xl",
                  )}
                >
                  {displayProduct.brand} {displayProduct.name}
                </h2>
                {(step === "configure" || step === "details") && attributeSummary && (
                  <div className="flex items-center justify-center gap-1 mt-1 text-sm">
                    <span className="text-muted-foreground">{attributeSummary}</span>
                    <span className="text-muted-foreground">·</span>
                    <button
                      onClick={() => {
                        if (step === "configure" && contentRef.current) {
                          setCapturedHeight(contentRef.current.offsetHeight);
                        }
                        setStep(step === "details" ? "configure" : "details");
                      }}
                      className="text-primary font-medium inline-flex items-center gap-0.5"
                    >
                      {step === "details" ? (
                        "Close details"
                      ) : (
                        <>
                          View details <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
                {/* Price below attributes */}
                {unitPrice && step === "configure" && (
                  <p className="text-lg font-bold text-foreground mt-1">
                    {totalPrice ? formatPrice(totalPrice) : "—"}
                  </p>
                )}
              </div>

              {/* Configure step: Attribute selectors, quantity */}
              {step === "configure" && (
                <div className="animate-fade-in">
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

              {/* Quantity */}
              <div className="px-6 pt-3">
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Quantity</span>
                    <QuantityControl value={quantity} onChange={setQuantity} />
                  </div>
                </div>
              </div>
                </div>
              )}

              {/* Details step: Product description */}
              {step === "details" && (
                <div className="px-6 pt-4 animate-fade-in">
                  <div className="mt-2 text-sm leading-relaxed text-left">
                    {/* Variant description (black text) */}
                    {matchedVariant?.description && (
                      <p className="text-foreground">{matchedVariant.description}</p>
                    )}

                    {/* Product description (brown/muted text) */}
                    {apiProduct?.description && (
                      <p className={matchedVariant?.description ? "mt-2 text-muted-foreground" : "text-foreground"}>
                        {apiProduct.description}
                      </p>
                    )}

                    {/* Fallback text if neither exists */}
                    {!matchedVariant?.description && !apiProduct?.description && descriptionText && (
                      <p className="text-foreground">{descriptionText}</p>
                    )}
                    {!matchedVariant?.description && !apiProduct?.description && !descriptionText && (
                      <>
                        <p className="text-foreground">
                          Premium quality product carefully selected for your baby's comfort and well-being. Made with gentle, hypoallergenic ingredients suitable for sensitive skin.
                        </p>
                        <p className="mt-2 text-muted-foreground">
                          Dermatologically tested. Free from harsh chemicals, parabens, and artificial fragrances. Trusted by
                          parents across Nigeria.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Purchase type step: One-time vs Subscribe */}
              {step === "purchase-type" && (
                <div className="px-6 pt-2 animate-fade-in">
                  <p className="text-xs text-muted-foreground mb-2 text-center">{selectedSummary}</p>

                  {/* One-Time option */}
                  <button
                    onClick={() => setPurchaseType("one-time")}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl border transition-all mb-3",
                      purchaseType === "one-time" ? "border-primary bg-primary/5" : "border-border",
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        purchaseType === "one-time" ? "border-primary" : "border-muted-foreground/40",
                      )}
                    >
                      {purchaseType === "one-time" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-sm font-medium text-foreground">One-Time Purchase</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {totalPrice ? formatPrice(totalPrice) : "—"}
                    </span>
                  </button>

                  {/* Subscribe option */}
                  <button
                    onClick={() => setPurchaseType("subscribe")}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-xl border transition-all",
                      purchaseType === "subscribe" ? "border-primary bg-primary/5" : "border-border",
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        purchaseType === "subscribe" ? "border-primary" : "border-muted-foreground/40",
                      )}
                    >
                      {purchaseType === "subscribe" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-sm font-medium text-foreground">
                        Subscribe & Save{" "}
                        {totalPrice && subscriptionTotal ? formatPrice(totalPrice - subscriptionTotal) : ""}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {subscriptionTotal ? formatPrice(subscriptionTotal) : "—"}
                    </span>
                  </button>

                  {/* Conditional: How it works OR frequency selector */}
                  {purchaseType !== "subscribe" ? (
                    <div className="mt-3 bg-secondary/50 rounded-xl p-3 animate-fade-in">
                      <p className="text-xs font-medium text-muted-foreground mb-2">How Subscription works</p>
                      <ul className="space-y-1.5">
                        <li className="flex items-start gap-2 text-xs text-foreground">
                          <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span>
                            <span className="font-semibold">Set & Forget:</span> Set a schedule to auto-renew ordering of
                            this item. Never run out again.
                          </span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-foreground">
                          <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span>
                            <span className="font-semibold">Pay As You Go:</span> You only get to pay days before each new
                            order.
                          </span>
                        </li>
                        <li className="flex items-start gap-2 text-xs text-foreground">
                          <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span>
                            <span className="font-semibold">Total Control:</span> Swap items, skip a month, or cancel
                            anytime.
                          </span>
                        </li>
                      </ul>
                    </div>
                  ) : (
                    <div className="mt-4 animate-fade-in">
                      <p className="text-sm font-medium text-foreground mb-2">Get it every</p>
                      <div ref={frequencyScrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
                        {frequencyOptions.map((opt) => (
                          <div key={opt.weeks} className="flex flex-col items-center min-w-[84px] shrink-0">
                            <button
                              data-frequency={opt.weeks}
                              onClick={() => setFrequencyWeeks(opt.weeks)}
                              className={cn(
                                "flex flex-col items-center justify-center w-full p-3 rounded-xl border-2 transition-all",
                                frequencyWeeks === opt.weeks
                                  ? "border-primary bg-primary/10"
                                  : "border-border bg-background",
                              )}
                            >
                              <RefreshCw
                                className={cn(
                                  "w-4 h-4 mb-1",
                                  frequencyWeeks === opt.weeks ? "text-primary" : "text-muted-foreground",
                                )}
                              />
                              <span
                                className={cn(
                                  "text-xs font-bold",
                                  frequencyWeeks === opt.weeks ? "text-primary" : "text-muted-foreground",
                                )}
                              >
                                {opt.label}
                              </span>
                            </button>
                            {opt.recommended && (
                              <span className="text-[9px] font-medium text-primary mt-1">Recommended</span>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end mt-1">
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground animate-pulse" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="px-6 py-4 shrink-0">
              {(step === "configure" || step === "details") && (
                <Button
                  variant="shop"
                  className="w-full h-12 rounded-xl"
                  onClick={handleAddToCartClick}
                  disabled={!unitPrice}
                >
                  {mode === 'select' ? 'Select' : 'Add to Cart'}
                </Button>
              )}
              {step === "purchase-type" && (
                <Button variant="shop" className="w-full h-12 rounded-xl" onClick={finalizeAddToCart}>
                  Done
                </Button>
              )}
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}