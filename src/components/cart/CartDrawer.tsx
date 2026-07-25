import { useNavigate } from "react-router-dom";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/contexts/CartContext";
import { CartItemRow } from "./CartItemRow";
import { formatPrice } from "@/lib/api";
import { ShoppingBag, RefreshCw } from "lucide-react";
import { metaPixel } from "@/lib/metaPixel";

export function CartDrawer() {
  const navigate = useNavigate();
  const { items, itemCount, totalAmount, isCartOpen, closeCart } = useCart();

  const handleProceed = () => {
    metaPixel.initiateCheckout({
      num_items: items.reduce((sum, i) => sum + i.quantity, 0),
      value: totalAmount / 100,
      currency: 'NGN',
    });
    closeCart();
    navigate("/checkout");
  };

  // Build upcoming renewals grouped by frequency
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
    <Drawer open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <DrawerContent className="h-[75vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 pt-2 pb-4 flex-shrink-0">
            <h2 className="text-lg font-bold text-foreground">
              Your Cart {itemCount > 0 && `(${itemCount} ${itemCount === 1 ? 'item' : 'items'})`}
            </h2>
          </div>

          {/* Scrollable Items */}
          {items.length > 0 ? (
            <>
              <div className="flex-1 min-h-0 px-6">
                <ScrollArea className="h-full">
                  <div className="space-y-3 pb-4 pr-2">
                    {items.map((item) => (
                      <CartItemRow
                        key={`${item.productId}-${item.typeId}-${item.sizeId || 'no-size'}`}
                        item={item}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-muted-foreground">{sortedRenewals.length > 0 ? 'Total Today' : 'Total'}</span>
                  <span className="text-xl font-bold text-foreground">
                    {formatPrice(totalAmount)}
                  </span>
                </div>

                {/* Upcoming renewals */}
                {sortedRenewals.length > 0 && (
                  <div className="bg-primary/5 rounded-lg p-3 mb-4">
                    <div className="mb-2">
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
                  onClick={handleProceed}
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
              <p className="text-muted-foreground text-center">
                Your cart is empty
              </p>
              <p className="text-sm text-muted-foreground/70 text-center mt-1">
                Add some products to get started
              </p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
