import { CartItem } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/api";

interface SubscribeSummaryProps {
  items: CartItem[];
}

export function SubscribeSummary({ items }: SubscribeSummaryProps) {
  const oneTimeItems = items.filter((item) => !item.isAutoRenew);
  const autoRenewItems = items.filter((item) => item.isAutoRenew);

  const oneTimeTotal = oneTimeItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const autoRenewOriginalTotal = autoRenewItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const autoRenewDiscountedTotal = autoRenewItems.reduce((sum, item) => {
    // Use custom subscription price if available, otherwise use regular price
    const subscriptionUnitPrice = item.subscriptionPrice || item.unitPrice;
    return sum + (subscriptionUnitPrice * item.quantity);
  }, 0);

  const totalSavings = autoRenewOriginalTotal - autoRenewDiscountedTotal;
  const grandTotal = oneTimeTotal + autoRenewDiscountedTotal;

  const allOneTime = autoRenewItems.length === 0;
  const allAutoRenew = oneTimeItems.length === 0 && autoRenewItems.length > 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-semibold text-foreground mb-3">Order Summary</h3>

      {allOneTime ? (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-bold text-lg text-foreground">
            {formatPrice(grandTotal)}
          </span>
        </div>
      ) : allAutoRenew ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">All items on Auto-Renew</span>
          </div>
          <div className="flex items-center justify-between text-sm text-amber-600">
            <span>5% savings applied</span>
            <span>-{formatPrice(totalSavings)}</span>
          </div>
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Total Today</span>
              <span className="font-bold text-lg text-foreground">
                {formatPrice(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">One-time items</span>
            <span className="text-foreground">{formatPrice(oneTimeTotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Auto-renew items</span>
            <span className="text-foreground">{formatPrice(autoRenewDiscountedTotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-amber-600">
            <span>(5% savings)</span>
            <span>-{formatPrice(totalSavings)}</span>
          </div>
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Total Today</span>
              <span className="font-bold text-lg text-foreground">
                {formatPrice(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
