import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { CartItemRow } from "./CartItemRow";
import { WalletBalancePill } from "@/components/wallet/WalletBalancePill";
import { formatPrice, api } from "@/lib/api";
import { useState } from "react";
import { ResumeOrderDrawer } from "./ResumeOrderDrawer";

interface DesktopCartViewProps {
  onBack: () => void;
}

export function DesktopCartView({ onBack }: DesktopCartViewProps) {
  const navigate = useNavigate();
  const { items, itemCount, totalAmount } = useCart();
  const { user, session } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [showResumeDrawer, setShowResumeDrawer] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{
    orderNumber: string;
    totalAmount: number;
    paymentOption: string | null;
  } | null>(null);

  const renewalGroups = items
    .filter((item) => item.isAutoRenew && item.frequencyWeeks)
    .reduce(
      (acc, item) => {
        const freq = item.frequencyWeeks!;
        const price = item.subscriptionPrice ?? item.unitPrice;
        acc[freq] = (acc[freq] || 0) + price * item.quantity;
        return acc;
      },
      {} as Record<number, number>,
    );

  const sortedRenewals = Object.entries(renewalGroups)
    .map(([weeks, amount]) => ({ weeks: Number(weeks), amount }))
    .sort((a, b) => a.weeks - b.weeks);


  const handleCheckout = async () => {
    if (!user || !session) {
      navigate("/checkout");
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
        setPendingOrder({
          orderNumber: result.orderNumber,
          totalAmount: result.totalAmount,
          paymentOption: result.paymentOption,
        });
        setShowResumeDrawer(true);
      } else {
        navigate("/checkout");
      }
    } catch {
      navigate("/checkout");
    } finally {
      setIsChecking(false);
    }
  };

  const handleResume = () => {
    setShowResumeDrawer(false);
    const isPayOnDelivery = pendingOrder!.paymentOption === "pay-on-delivery";
    if (isPayOnDelivery) {
      navigate("/checkout");
    } else {
      navigate("/checkout", {
        state: {
          resumeOrderNumber: pendingOrder!.orderNumber,
          resumeAmount: pendingOrder!.totalAmount,
        },
      });
    }
  };

  const handleCancelAndNew = async () => {
    setIsCancelling(true);
    await api.cancelOrder(pendingOrder!.orderNumber, session!.access_token);
    setIsCancelling(false);
    setShowResumeDrawer(false);
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Top nav */}
      <div className="border-b bg-background/80 backdrop-blur sticky top-20 z-20">
        <div className="container flex items-center h-14 gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Shop
          </button>
          <span className="text-muted-foreground/40">/</span>
          <h1 className="text-base font-bold text-foreground">
            Your Cart{itemCount > 0 ? ` (${itemCount})` : ""}
          </h1>
          <div className="ml-auto">
            <WalletBalancePill size="sm" />
          </div>
        </div>
      </div>

      <div className="container py-8">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <ShoppingBag className="w-7 h-7 text-muted-foreground/60" strokeWidth={1.5} />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">Your cart is empty</p>
            <p className="text-sm text-muted-foreground mb-6">Browse the shop to add products</p>
            <Button variant="shop" onClick={() => navigate("/catalogue")}>
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-8">
            {/* Items list */}
            <div className="col-span-12 lg:col-span-7">
              <div className="bg-card rounded-3xl border border-foreground/[0.06] overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border">
                  <h2 className="text-sm font-bold text-foreground">
                    {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
                  </h2>
                </div>
                <div className="divide-y divide-border px-5">
                  {items.map((item) => (
                    <CartItemRow
                      key={`${item.productId}-${item.typeId}-${item.sizeId || "no-size"}`}
                      item={item}
                    />
                  ))}
                </div>
                <div className="px-5 py-4 border-t border-border">
                  <button
                    onClick={() => navigate("/catalogue")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    + Add more products
                  </button>
                </div>
              </div>
            </div>

            {/* Order summary */}
            <div className="col-span-12 lg:col-span-5">
              <div className="lg:sticky lg:top-36 space-y-4">
                <div className="bg-card rounded-3xl border border-foreground/[0.06] overflow-hidden shadow-sm p-6 space-y-4">
                  <h2 className="text-sm font-bold text-foreground">Order Summary</h2>

                  {/* Line items */}
                  <div className="space-y-2">
                    {items.map((item) => {
                      const displayPrice =
                        item.isAutoRenew && item.subscriptionPrice
                          ? item.subscriptionPrice
                          : item.unitPrice;
                      const lineTotal = displayPrice * item.quantity;
                      return (
                        <div
                          key={`${item.productId}-${item.typeId}`}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-muted-foreground truncate flex-1 mr-4">
                            {item.productName} × {item.quantity}
                            {item.isAutoRenew && (
                              <span className="ml-1 text-[10px] text-primary font-medium">
                                Subscribe
                              </span>
                            )}
                          </span>
                          <span className="font-medium text-foreground shrink-0">
                            {formatPrice(lineTotal)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{formatPrice(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery</span>
                      <span className="font-medium text-emerald-700">Calculated at checkout</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-bold text-foreground">
                      {sortedRenewals.length > 0 ? "Total Today" : "Total"}
                    </span>
                    <span className="font-bold text-lg text-foreground">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>

                  <Button
                    variant="shop"
                    className="w-full h-12 text-base font-semibold rounded-2xl"
                    onClick={handleCheckout}
                    disabled={isChecking}
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Checking…
                      </>
                    ) : (
                      "Proceed to Checkout"
                    )}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Secure checkout — your info is protected
                  </p>
                </div>

                {/* Future renewals */}
                {sortedRenewals.length > 0 && (
                  <div className="bg-card rounded-2xl border border-foreground/[0.06] p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <RefreshCw className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Future subscription payments
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {sortedRenewals.map(({ weeks, amount }) => (
                        <div key={weeks} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            In {weeks} week{weeks !== 1 ? "s" : ""}
                          </span>
                          <span className="font-medium text-foreground">{formatPrice(amount)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                      You'll only be charged days before each renewal. Cancel or pause anytime.
                    </p>
                  </div>
                )}
              </div>
            </div>
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
    </div>
  );
}
