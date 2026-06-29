import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/api";
import { QuantityControl } from "@/components/cart/QuantityControl";
import { useCart } from "@/contexts/CartContext";
import { useProductDetail } from "@/hooks/useCatalogue";
import { apiProductToCatalogue, resolveVariant } from "@/lib/catalogueAdapter";
import { ArrowLeft, ChevronRight, RefreshCw, Check, Share2, ZoomIn, X } from "lucide-react";
import { toast } from "sonner";

async function shareProduct(title: string, slug: string) {
  const url = `${window.location.origin}/catalogue/${slug}`;
  const text = `Check out ${title} on Nesta Hub`;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard", { duration: 2500 });
  } catch {
    toast.error("Unable to share. Please try again.");
  }
}

interface ProductDetailContentProps {
  /** Product slug or id to fetch full detail (variants + attributes) for. */
  productKey: string;
  /** Called after the user successfully adds the item to cart (closes host drawer). */
  onAdded: () => void;
  /** When true, the floating share button is rendered. Defaults to true. */
  showShareButton?: boolean;
  /** When true, body sizes to its content instead of filling host height. */
  fitContent?: boolean;
  /** When provided, a back arrow is rendered top-left mirroring share. */
  onBack?: () => void;
}

type DrawerStep = "configure" | "details" | "purchase-type";

const FREQUENCY_OPTIONS = [
  { weeks: 1, label: "1 week", recommended: true },
  { weeks: 2, label: "2 weeks", recommended: false },
  { weeks: 3, label: "3 weeks", recommended: false },
  { weeks: 4, label: "4 weeks", recommended: false },
  { weeks: 6, label: "6 weeks", recommended: false },
  { weeks: 8, label: "8 weeks", recommended: false },
];

export function ProductDetailContent({
  productKey,
  onAdded,
  showShareButton = true,
  fitContent = false,
  onBack,
}: ProductDetailContentProps) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { data: detail, isLoading } = useProductDetail(productKey);

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState<DrawerStep>("configure");
  const [purchaseType, setPurchaseType] = useState<"one-time" | "subscribe">("one-time");
  const [frequencyWeeks, setFrequencyWeeks] = useState(1);
  const [imageZoomOpen, setImageZoomOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [capturedHeight, setCapturedHeight] = useState<number | null>(null);

  // Selection view-model derived from the live product detail.
  const product = useMemo(
    () => (detail ? apiProductToCatalogue(detail) : null),
    [detail],
  );

  // Reset selection whenever the underlying product changes.
  useEffect(() => {
    if (!product) return;
    setSelectedTypeId(product.types[0]?.id || null);
    setSelectedSizeId(product.sizes?.[0]?.id || null);
    setQuantity(1);
    setStep("configure");
    setPurchaseType("one-time");
    setFrequencyWeeks(1);
    setCapturedHeight(null);
    setImageZoomOpen(false);
  }, [product]);

  // Resolve the concrete API variant for the current selection.
  const variant = useMemo(() => {
    if (!detail) return undefined;
    return resolveVariant(detail, selectedTypeId, selectedSizeId);
  }, [detail, selectedTypeId, selectedSizeId]);

  const unitPrice = variant?.price ?? null;
  const canAdd = !!variant && unitPrice != null;

  const totalPrice = useMemo(
    () => (unitPrice != null ? unitPrice * quantity : null),
    [unitPrice, quantity],
  );

  // Subscription total: per-unit variant.subscriptionPrice * qty when present,
  // otherwise falls back to the regular total (mirrors ProductDetailDrawer).
  const subscriptionTotal = useMemo(() => {
    if (totalPrice == null) return null;
    if (variant?.subscriptionPrice) return variant.subscriptionPrice * quantity;
    return totalPrice;
  }, [totalPrice, variant, quantity]);

  // Prefer the variant's recommended frequency when subscribing.
  useEffect(() => {
    if (purchaseType === "subscribe" && variant?.recommendedFrequencyWeeks) {
      setFrequencyWeeks(variant.recommendedFrequencyWeeks);
    }
  }, [purchaseType, variant]);

  const handleAddToCartClick = () => setStep("purchase-type");

  const finalizeAddToCart = () => {
    if (!detail || !product || !variant || unitPrice == null) return;
    const selectedType = product.types.find((t) => t.id === selectedTypeId);
    const selectedSize = product.sizes?.find((s) => s.id === selectedSizeId);
    const isSubscribe = purchaseType === "subscribe";

    addToCart(
      {
        variantId: variant.id,
        productId: detail.id,
        productName: detail.name,
        brand: detail.brand,
        slug: detail.slug,
        typeId: selectedTypeId || "_default",
        typeName: selectedType?.name || "",
        sizeId: selectedSizeId || undefined,
        sizeName: selectedSize?.name,
        attributes: variant.attributes.map((a) => ({
          attributeName: a.attributeName,
          value: a.value,
          displayValue: a.displayValue,
        })),
        unitPrice,
        image: detail.imageUrl,
        isAutoRenew: isSubscribe,
        frequencyWeeks: isSubscribe ? frequencyWeeks : undefined,
        subscriptionPrice: variant.subscriptionPrice,
        recommendedFrequencyWeeks: variant.recommendedFrequencyWeeks,
      },
      quantity,
    );

    onAdded();
    toast.success("Added to cart", {
      duration: 3000,
      action: {
        label: "Go to Cart",
        onClick: () => navigate('/cart'),
      },
    });
  };

  const attributeSummary = useMemo(() => {
    if (!product || !selectedTypeId) return "";
    const type = product.types.find((t) => t.id === selectedTypeId);
    const size = product.sizes?.find((s) => s.id === selectedSizeId);
    const parts = [type?.name];
    if (size) parts.push(size.name);
    return parts.filter(Boolean).join(" · ");
  }, [product, selectedTypeId, selectedSizeId]);

  const selectedSummary = attributeSummary ? `${attributeSummary} · Qty: ${quantity}` : `Qty: ${quantity}`;

  const descriptionText = useMemo(() => {
    if (variant?.description) return variant.description;
    return detail?.description || null;
  }, [variant, detail]);

  const isPurchaseStep = step === "purchase-type";

  if (isLoading || !detail || !product) {
    return (
      <div className={cn("relative flex flex-col items-center justify-center", fitContent ? "py-16" : "h-full")}>
        <div className="animate-pulse text-sm text-muted-foreground">Loading product…</div>
      </div>
    );
  }

  const image = detail.imageUrl;
  const titleName = `${detail.brand} ${detail.name}`;

  return (
    <div className={cn("relative flex flex-col", fitContent ? "" : "h-full")}>
      {onBack && (
        <div className="absolute top-3 left-3 z-10">
          <button
            onClick={onBack}
            aria-label="Back"
            className="w-9 h-9 rounded-full bg-secondary/80 hover:bg-secondary flex items-center justify-center text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      )}
      {showShareButton && (
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={() => shareProduct(titleName, detail.slug)}
            aria-label="Share product"
            className="w-9 h-9 rounded-full bg-secondary/80 hover:bg-secondary flex items-center justify-center text-foreground transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      )}
      <div
        ref={contentRef}
        className={cn("overflow-y-auto", fitContent ? "" : "flex-1")}
        style={step === "details" && capturedHeight ? { minHeight: capturedHeight } : undefined}
      >
        {/* Product image */}
        <div className="px-6 pt-2">
          <div
            className={cn(
              "relative aspect-square rounded-2xl bg-secondary/50 overflow-hidden mx-auto transition-all duration-300",
              isPurchaseStep ? "max-w-[80px]" : "max-w-[140px]",
            )}
          >
            <button
              type="button"
              onClick={() => setImageZoomOpen(true)}
              aria-label="View larger image"
              className="w-full h-full block group relative"
            >
              {image ? (
                <img src={image} alt={detail.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-secondary/80 to-secondary/30" />
              )}
              {!isPurchaseStep && (
                <span className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-foreground shadow-sm transition-transform group-active:scale-95">
                  <ZoomIn className="w-3.5 h-3.5" />
                </span>
              )}
            </button>
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
            {titleName}
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
          {step === "configure" && (
            <p className="text-lg font-bold text-foreground mt-1">
              {totalPrice != null ? formatPrice(totalPrice) : "—"}
            </p>
          )}
          {step === "configure" && !canAdd && (
            <p className="text-xs text-destructive mt-1">
              {"This combination is unavailable"}
            </p>
          )}
        </div>

        {step === "configure" && (
          <div className="animate-fade-in">
            <div className="px-6 pt-3 text-left">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Type</label>
              <div className="flex flex-wrap gap-2 justify-start">
                {product.types.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedTypeId(type.id)}
                    className={cn(
                      "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                      selectedTypeId === type.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            {product.sizes && product.sizes.length > 0 && (
              <div className="px-6 pt-3 text-left">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Size</label>
                <div className="flex flex-wrap gap-2 justify-start">
                  {product.sizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSizeId(size.id)}
                      className={cn(
                        "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                        selectedSizeId === size.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

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

        {step === "details" && (
          <div className="px-6 pt-4 animate-fade-in">
            <div className="mt-2 text-sm text-foreground leading-relaxed text-left">
              <p>
                {descriptionText ||
                  "Premium quality product carefully selected for your baby's comfort and well-being. Made with gentle, hypoallergenic ingredients suitable for sensitive skin."}
              </p>
              <p className="mt-2 text-muted-foreground">
                Dermatologically tested. Free from harsh chemicals, parabens, and artificial fragrances. Trusted by
                parents across Nigeria.
              </p>
            </div>
          </div>
        )}

        {step === "purchase-type" && (
          <div className="px-6 pt-2 animate-fade-in">
            <p className="text-xs text-muted-foreground mb-2 text-center">{selectedSummary}</p>

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
                {totalPrice != null ? formatPrice(totalPrice) : "—"}
              </span>
            </button>

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
                  {totalPrice != null && subscriptionTotal != null && totalPrice > subscriptionTotal
                    ? formatPrice(totalPrice - subscriptionTotal)
                    : ""}
                </span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {subscriptionTotal != null ? formatPrice(subscriptionTotal) : "—"}
              </span>
            </button>

            {purchaseType !== "subscribe" ? (
              <div className="mt-3 bg-secondary/50 rounded-xl p-3 animate-fade-in">
                <p className="text-xs font-medium text-muted-foreground mb-2">How Subscription works</p>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2 text-xs text-foreground">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>
                      <span className="font-semibold">Set & Forget:</span> Set a schedule to auto-renew ordering of this
                      item. Never run out again.
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
                      <span className="font-semibold">Total Control:</span> Swap items, skip a month, or cancel anytime.
                    </span>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="mt-4 animate-fade-in">
                <p className="text-sm font-medium text-foreground mb-2">Get it every</p>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <div key={opt.weeks} className="flex flex-col items-center min-w-[84px] shrink-0">
                      <button
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

      {/* CTA */}
      <div className="px-6 py-4 shrink-0">
        {(step === "configure" || step === "details") && (
          <Button
            variant="shop"
            className="w-full h-12 rounded-xl"
            onClick={handleAddToCartClick}
            disabled={!canAdd}
          >
            {canAdd ? "Add to Cart" : "Unavailable"}
          </Button>
        )}
        {step === "purchase-type" && (
          <Button variant="shop" className="w-full h-12 rounded-xl" onClick={finalizeAddToCart} disabled={!canAdd}>
            Done
          </Button>
        )}
      </div>

      {/* Image zoom lightbox */}
      {imageZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center animate-fade-in"
          onClick={() => setImageZoomOpen(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setImageZoomOpen(false);
            }}
            aria-label="Close magnified image"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-secondary/80 hover:bg-secondary flex items-center justify-center text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {image ? (
            <img
              src={image}
              alt={detail.name}
              onClick={(e) => e.stopPropagation()}
              className="max-w-[92vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-[92vw] h-[80vw] max-w-[480px] max-h-[480px] rounded-2xl shadow-2xl bg-gradient-to-br from-secondary/80 to-secondary/30"
            />
          )}
        </div>
      )}
    </div>
  );
}
