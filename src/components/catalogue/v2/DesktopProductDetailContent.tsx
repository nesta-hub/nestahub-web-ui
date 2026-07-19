import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/api";
import { QuantityControl } from "@/components/cart/QuantityControl";
import { useCart } from "@/contexts/CartContext";
import { useProductDetail } from "@/hooks/useCatalogue";
import { apiProductToCatalogue, resolveVariant, attrValue, defaultSelectedAttrs } from "@/lib/catalogueAdapter";
import { CloudinaryPresets } from "@/lib/cloudinary";
import { ArrowLeft, RefreshCw, Check, Share2, ZoomIn, X, ShoppingBag } from "lucide-react";
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

const FREQUENCY_OPTIONS = [
  { weeks: 1, label: "1 week", recommended: true },
  { weeks: 2, label: "2 weeks", recommended: false },
  { weeks: 3, label: "3 weeks", recommended: false },
  { weeks: 4, label: "4 weeks", recommended: false },
  { weeks: 6, label: "6 weeks", recommended: false },
  { weeks: 8, label: "8 weeks", recommended: false },
];

export function DesktopProductDetailContent({
  productKey,
  onAdded,
  showShareButton = true,
  fitContent = false,
  onBack,
}: ProductDetailContentProps) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { data: detail, isLoading } = useProductDetail(productKey);

  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [purchaseType, setPurchaseType] = useState<"one-time" | "subscribe">("one-time");
  const [frequencyWeeks, setFrequencyWeeks] = useState(1);
  const [imageZoomOpen, setImageZoomOpen] = useState(false);

  const product = useMemo(
    () => (detail ? apiProductToCatalogue(detail) : null),
    [detail],
  );

  useEffect(() => {
    if (!product || !detail) return;
    const initial = defaultSelectedAttrs(detail, product) ?? {};
    if (!Object.keys(initial).length) {
      for (const attr of product.attributes ?? []) {
        if (attr.values[0]) initial[attr.name] = attr.values[0].id;
      }
    }
    setSelectedAttrs(initial);
    setQuantity(1);
    setPurchaseType("one-time");
    setFrequencyWeeks(1);
    setImageZoomOpen(false);
  }, [product, detail]);

  const variant = useMemo(() => {
    if (!detail) return undefined;
    return resolveVariant(detail, selectedAttrs);
  }, [detail, selectedAttrs]);

  const unitPrice = variant?.price ?? null;
  const canAdd = !!variant && variant.isActive && unitPrice != null;

  const totalPrice = useMemo(
    () => (unitPrice != null ? unitPrice * quantity : null),
    [unitPrice, quantity],
  );

  const subscriptionTotal = useMemo(() => {
    if (totalPrice == null) return null;
    if (variant?.subscriptionPrice) return variant.subscriptionPrice * quantity;
    return totalPrice;
  }, [totalPrice, variant, quantity]);

  useEffect(() => {
    if (purchaseType === "subscribe" && variant?.recommendedFrequencyWeeks) {
      setFrequencyWeeks(variant.recommendedFrequencyWeeks);
    }
  }, [purchaseType, variant]);

  const finalizeAddToCart = () => {
    if (!detail || !product || !variant || unitPrice == null) return;
    const firstAttr = product.attributes?.[0];
    const secondAttr = product.attributes?.[1];
    const isSubscribe = purchaseType === "subscribe";

    addToCart(
      {
        variantId: variant.id,
        productId: detail.id,
        productName: detail.name,
        brand: detail.brand,
        slug: detail.slug,
        typeId: (firstAttr ? selectedAttrs[firstAttr.name] : null) || "_default",
        typeName: firstAttr?.values.find((v) => v.id === selectedAttrs[firstAttr.name])?.name || "",
        sizeId: secondAttr ? selectedAttrs[secondAttr.name] : undefined,
        sizeName: secondAttr?.values.find((v) => v.id === selectedAttrs[secondAttr.name])?.name,
        attributes: variant.attributes.map((a) => ({
          attributeName: a.attributeName,
          value: a.value,
          displayValue: a.displayValue,
        })),
        unitPrice,
        image: variant.imageUrl || detail.imageUrl,
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

  const descriptionText = useMemo(() => {
    if (variant?.description) return variant.description;
    return detail?.description || null;
  }, [variant, detail]);

  if (isLoading || !detail || !product) {
    return (
      <div className={cn("relative flex flex-col items-center justify-center", fitContent ? "py-16" : "h-full")}>
        <div className="animate-pulse text-sm text-muted-foreground">Loading product…</div>
      </div>
    );
  }

  const image = variant?.imageUrl || detail.imageUrl;
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

      <div className={cn("overflow-y-auto", fitContent ? "" : "flex-1")}>
        {/* Image */}
        <div className="px-6 pt-6 flex justify-center">
          <div className="relative w-[180px] h-[180px] rounded-2xl bg-secondary/50 overflow-hidden">
            <button
              type="button"
              onClick={() => setImageZoomOpen(true)}
              aria-label="View larger image"
              className="w-full h-full block group relative"
            >
              {image ? (
                <img src={CloudinaryPresets.catalogueCard(image)} alt={detail.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-secondary/80 to-secondary/30" />
              )}
              <span className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-secondary/80 backdrop-blur-sm flex items-center justify-center text-foreground shadow-sm transition-transform group-active:scale-95">
                <ZoomIn className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        </div>

        {/* Name + price */}
        <div className="px-6 pt-4 text-center">
          <h2 className="text-xl font-bold text-foreground leading-snug">{titleName}</h2>
          <p className="text-2xl font-bold text-primary mt-1">
            {totalPrice != null ? formatPrice(totalPrice) : "—"}
          </p>
          {!canAdd && (
            <p className="text-xs text-destructive mt-1">This combination is unavailable</p>
          )}
        </div>

        {/* Description — directly below price */}
        {descriptionText && (
          <div className="px-6 pt-3">
            <p className="text-sm text-muted-foreground leading-relaxed text-center">
              {descriptionText}
            </p>
          </div>
        )}

        <div className="px-6 mt-4">
          <div className="h-px bg-border" />
        </div>

        {/* Attribute selectors — one per axis */}
        {product.attributes?.map((attr, i) => (
          <div key={attr.name} className={cn("px-6", i === 0 ? "pt-5" : "pt-4")}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">{attr.name}</p>
            <div className="flex flex-wrap gap-2">
              {attr.values.map((v) => {
                const otherSelected = Object.fromEntries(
                  Object.entries(selectedAttrs).filter(([k]) => k !== attr.name)
                );
                const isAvailable = detail.variants.some(
                  (variant) =>
                    variant.isActive &&
                    attrValue(variant, attr.name) === v.id &&
                    Object.entries(otherSelected).every(([k, sel]) => attrValue(variant, k) === sel),
                );
                return (
                  <button
                    key={v.id}
                    disabled={!isAvailable}
                    onClick={() => setSelectedAttrs((prev) => ({ ...prev, [attr.name]: v.id }))}
                    className={cn(
                      "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                      selectedAttrs[attr.name] === v.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 text-foreground",
                      !isAvailable && "opacity-40 cursor-not-allowed pointer-events-none",
                    )}
                  >
                    {v.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Quantity */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quantity</p>
            <QuantityControl value={quantity} onChange={setQuantity} />
          </div>
        </div>

        <div className="px-6 mt-4">
          <div className="h-px bg-border" />
        </div>

        {/* Purchase type — icon cards */}
        <div className="px-6 pt-5">
          <div className="flex gap-3">
            <button
              onClick={() => setPurchaseType("one-time")}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all",
                purchaseType === "one-time"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 bg-background",
              )}
            >
              <ShoppingBag
                className={cn("w-5 h-5", purchaseType === "one-time" ? "text-primary" : "text-muted-foreground")}
                strokeWidth={1.5}
              />
              <span className={cn("text-xs font-semibold", purchaseType === "one-time" ? "text-primary" : "text-foreground")}>
                One-Time
              </span>
              <span className={cn("text-xs font-bold", purchaseType === "one-time" ? "text-primary" : "text-foreground")}>
                {totalPrice != null ? formatPrice(totalPrice) : "—"}
              </span>
            </button>
            <button
              onClick={() => setPurchaseType("subscribe")}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all",
                purchaseType === "subscribe"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 bg-background",
              )}
            >
              <RefreshCw
                className={cn("w-5 h-5", purchaseType === "subscribe" ? "text-primary" : "text-muted-foreground")}
                strokeWidth={1.5}
              />
              <span className={cn("text-xs font-semibold", purchaseType === "subscribe" ? "text-primary" : "text-foreground")}>
                Subscribe & Save
              </span>
              <span className={cn("text-xs font-bold", purchaseType === "subscribe" ? "text-primary" : "text-foreground")}>
                {subscriptionTotal != null ? formatPrice(subscriptionTotal) : "—"}
                {totalPrice != null && subscriptionTotal != null && totalPrice > subscriptionTotal
                  ? ` · save ${formatPrice(totalPrice - subscriptionTotal)}`
                  : ""}
              </span>
            </button>
          </div>

          {/* Subscribe info or frequency picker */}
          {purchaseType === "one-time" ? (
            <div className="mt-3 bg-secondary/50 rounded-xl p-3 animate-fade-in">
              <p className="text-xs font-medium text-muted-foreground mb-2">How Subscription works</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2 text-xs text-foreground">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold">Set & Forget:</span> Set a schedule to auto-renew ordering of this item. Never run out again.
                  </span>
                </li>
                <li className="flex items-start gap-2 text-xs text-foreground">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold">Pay As You Go:</span> You only get to pay days before each new order.
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
            </div>
          )}
        </div>

        {/* CTA — inline, reduced width */}
        <div className="flex justify-center mt-6 mb-8">
          <Button
            variant="shop"
            className="h-12 px-10 rounded-xl min-w-[200px]"
            onClick={finalizeAddToCart}
            disabled={!canAdd}
          >
            {canAdd ? "Add to Cart" : "Unavailable"}
          </Button>
        </div>
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
              src={CloudinaryPresets.detail(image)}
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
