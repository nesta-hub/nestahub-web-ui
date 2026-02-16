import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useCart, calculateSubscriptionPrice } from "@/contexts/CartContext";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { formatPrice } from "@/lib/api";
import { ArrowLeft, ShoppingBag, RefreshCw } from "lucide-react";

const Cart = () => {
  const navigate = useNavigate();
  const { items, itemCount, totalAmount } = useCart();

  const renewalGroups = items
    .filter(item => item.isAutoRenew && item.frequencyWeeks)
    .reduce((acc, item) => {
      const freq = item.frequencyWeeks!;
      // Use custom subscription price if available, otherwise use regular price
      const subscriptionUnitPrice = item.subscriptionPrice || item.unitPrice;
      const amount = subscriptionUnitPrice * item.quantity;
      acc[freq] = (acc[freq] || 0) + amount;
      return acc;
    }, {} as Record<number, number>);

  const sortedRenewals = Object.entries(renewalGroups)
    .map(([weeks, amount]) => ({ weeks: Number(weeks), amount }))
    .sort((a, b) => a.weeks - b.weeks);

  return (
    <Layout showNav={false}>
      <div className="min-h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-bold text-foreground">
            Your Cart {itemCount > 0 && `(${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}
          </h1>
        </div>

        {items.length > 0 ? (
          <>
            {/* Items */}
            <div className="flex-1 px-4">
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <CartItemRow
                    key={`${item.productId}-${item.typeId}-${item.sizeId || 'no-size'}`}
                    item={item}
                  />
                ))}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-background border-t border-border px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground">Total Today</span>
                <span className="text-xl font-bold text-foreground">
                  {formatPrice(totalAmount)}
                </span>
              </div>

              {sortedRenewals.length > 0 && (
                <div className="bg-primary/5 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <RefreshCw className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-foreground">Future payments</span>
                  </div>
                  <div className="space-y-1">
                    {sortedRenewals.map(({ weeks, amount }) => (
                      <div key={weeks} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">In {weeks} weeks</span>
                        <span className="font-medium text-foreground">{formatPrice(amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                variant="shop"
                className="w-full h-12 rounded-xl text-base"
                onClick={() => navigate("/checkout")}
              >
                Checkout
              </Button>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-center">Your cart is empty</p>
            <p className="text-sm text-muted-foreground/70 text-center mt-1">
              Add some products to get started
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cart;
