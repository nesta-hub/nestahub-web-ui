import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Truck } from "lucide-react";
import type { ConfiguredProduct, SubscriptionConfig, Stage, BundleTier } from "@/data/bundleData";
import { formatPrice, getSubscriptionPrice } from "@/data/bundleData";

interface OrderSummaryProps {
  stage: Stage;
  tier: BundleTier;
  products: ConfiguredProduct[];
  totalPrice: number;
  subscriptionConfig: SubscriptionConfig;
}

export function OrderSummary({
  stage,
  tier,
  products,
  totalPrice,
  subscriptionConfig,
}: OrderSummaryProps) {
  const isSubscription = subscriptionConfig.frequency !== "one-time";
  const finalPrice = isSubscription ? getSubscriptionPrice(totalPrice) : totalPrice;
  const savings = isSubscription ? totalPrice - finalPrice : 0;
  const freeShipping = finalPrice >= 15000;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6 sticky top-24">
      {/* Header */}
      <div>
        <h3 className="font-bold text-lg text-foreground">{tier.name}</h3>
        <p className="text-sm text-muted-foreground">
          {stage.name} • {stage.ageRange || stage.weightRange}
        </p>
      </div>

      <Separator />

      {/* Line items */}
      <div className="space-y-3">
        {products.map((product, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-foreground">
              {product.category}{" "}
              <span className="text-muted-foreground">
                ({product.selectedVariant.brand})
              </span>
            </span>
            <span className="text-muted-foreground">
              {product.selectedVariant.priceDelta > 0
                ? `+${formatPrice(product.selectedVariant.priceDelta)}`
                : "Included"}
            </span>
          </div>
        ))}

        {/* Size adjustments (if any) */}
        {products.some((p) => p.selectedSize && p.selectedSize.priceDelta > 0) && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Size adjustment</span>
            <span className="text-muted-foreground">
              +{formatPrice(
                products.reduce(
                  (acc, p) => acc + (p.selectedSize?.priceDelta || 0),
                  0
                )
              )}
            </span>
          </div>
        )}
      </div>

      <Separator />

      {/* Subtotal */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-foreground">Subtotal</span>
          <span className="font-medium text-foreground">{formatPrice(totalPrice)}</span>
        </div>

        {isSubscription && (
          <div className="flex justify-between text-green-600">
            <span>Subscription discount</span>
            <span>-{formatPrice(savings)}</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Total */}
      <div className="flex justify-between items-baseline">
        <span className="text-lg font-semibold text-foreground">Total</span>
        <span className="text-2xl font-bold text-foreground">
          {formatPrice(finalPrice)}
        </span>
      </div>

      {/* CTA */}
      <Button className="w-full" size="lg">
        Add to Cart
      </Button>

      {/* Free shipping notice */}
      <div
        className={`flex items-center gap-2 text-sm ${
          freeShipping ? "text-green-600" : "text-muted-foreground"
        }`}
      >
        {freeShipping ? (
          <>
            <Check className="w-4 h-4" />
            <span>Free shipping on this order</span>
          </>
        ) : (
          <>
            <Truck className="w-4 h-4" />
            <span>
              Add {formatPrice(15000 - finalPrice)} more for free shipping
            </span>
          </>
        )}
      </div>
    </div>
  );
}
