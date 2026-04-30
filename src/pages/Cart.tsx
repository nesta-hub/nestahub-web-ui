import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { ResumeOrderDrawer } from "@/components/cart/ResumeOrderDrawer";
import { api, formatPrice } from "@/lib/api";
import { ArrowLeft, ShoppingBag, RefreshCw, Loader2 } from "lucide-react";

const Cart = () => {
  const navigate = useNavigate();
  const { items, itemCount, totalAmount } = useCart();
  const { user, session } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [showResumeDrawer, setShowResumeDrawer] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{ orderNumber: string; totalAmount: number; paymentOption: string | null } | null>(null);

  const handleCheckout = async () => {
    if (!user || !session) {
      navigate('/checkout');
      return;
    }

    setIsChecking(true);

    try {
      const cartItems = items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        isAutoRenew: i.isAutoRenew ?? false,
        frequencyWeeks: i.isAutoRenew ? (i.frequencyWeeks ?? null) : null,
      }));
      const result = await api.checkPendingMatch(cartItems, session.access_token);

      if (result.match) {
        setPendingOrder({ orderNumber: result.orderNumber, totalAmount: result.totalAmount, paymentOption: result.paymentOption });
        setShowResumeDrawer(true);
      } else {
        navigate('/checkout');
      }
    } catch (error) {
      console.error('[Cart] Failed to check pending orders:', error);
      navigate('/checkout');
    } finally {
      setIsChecking(false);
    }
  };

  const handleResume = () => {
    setShowResumeDrawer(false);
    const isPayOnDelivery = pendingOrder!.paymentOption === 'pay-on-delivery';

    if (isPayOnDelivery) {
      // For pay-on-delivery: user wants to create a NEW duplicate order
      // Navigate to checkout without resumeOrderNumber - creates new order
      navigate('/checkout');
    } else {
      // For pay-now: resume payment for existing order
      navigate('/checkout', {
        state: { resumeOrderNumber: pendingOrder!.orderNumber, resumeAmount: pendingOrder!.totalAmount },
      });
    }
  };

  const handleCancelAndNew = async () => {
    setIsCancelling(true);
    await api.cancelOrder(pendingOrder!.orderNumber, session!.access_token);
    setIsCancelling(false);
    setShowResumeDrawer(false);
    navigate('/checkout');
  };

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
                <span className="text-muted-foreground">{sortedRenewals.length > 0 ? 'Total Today' : 'Total'}</span>
                <span className="text-xl font-bold text-foreground">
                  {formatPrice(totalAmount)}
                </span>
              </div>

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
                onClick={handleCheckout}
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Checkout'
                )}
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
      {pendingOrder && (
        <ResumeOrderDrawer
          open={showResumeDrawer}
          onOpenChange={setShowResumeDrawer}
          existingOrderNumber={pendingOrder.orderNumber}
          existingTotalAmount={pendingOrder.totalAmount}
          paymentOption={pendingOrder.paymentOption}
          onResume={handleResume}
          onCancelAndNew={handleCancelAndNew}
          isCancelling={isCancelling}
        />
      )}
    </Layout>
  );
};

export default Cart;
