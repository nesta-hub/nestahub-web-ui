import { useState } from "react";
import { ArrowLeft, ChevronDown, MapPin, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from "@/components/ui/drawer";
import { CheckoutPaymentView } from "@/components/checkout/CheckoutPaymentView";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyOrders, formatPrice, MyOrder, api } from "@/lib/api";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; className: string }> = {
  order_submitted: { label: "Awaiting Payment", className: "bg-blue-100 text-blue-700 border-blue-200" },
  payment_made: { label: "Pending", className: "bg-blue-100 text-blue-700 border-blue-200" },
  payment_confirmed: { label: "Processing", className: "bg-amber-100 text-amber-700 border-amber-200" },
  processing: { label: "Processing", className: "bg-amber-100 text-amber-700 border-amber-200" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700 border-green-200" },
  delivered: { label: "Delivered", className: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 border-red-200" },
  expired: { label: "Expired", className: "bg-gray-100 text-gray-500 border-gray-200" },
};

function formatOrderDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface OrdersViewProps {
  onBack: () => void;
}

export function OrdersView({ onBack }: OrdersViewProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MyOrder | null>(null);
  const [payingOrder, setPayingOrder] = useState<MyOrder | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => getMyOrders(session?.access_token ?? ""),
    enabled: !!session?.access_token,
  });

  const orders = data?.orders ?? [];

  const toggleExpand = (orderNumber: string) => {
    setExpandedId((prev) => (prev === orderNumber ? null : orderNumber));
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget || !session?.access_token) return;

    setIsCancelling(true);
    try {
      await api.cancelOrder(cancelTarget.orderNumber, session.access_token);
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success(`Order ${cancelTarget.orderNumber} cancelled successfully`);
      setCancelTarget(null);
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePaymentConfirmed = () => {
    queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    toast.success('Payment confirmed successfully');
    setPayingOrder(null);
  };

  // Show payment view if user clicked "Confirm Payment"
  if (payingOrder && session?.access_token) {
    return (
      <CheckoutPaymentView
        orderId={payingOrder.orderNumber}
        totalAmount={payingOrder.totalAmount}
        token={session.access_token}
        onPaymentConfirmed={handlePaymentConfirmed}
        onBack={() => setPayingOrder(null)}
        hideGiftCardRedeem={payingOrder.orderType === 'gift_card'}
      />
    );
  }

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-1 -ml-1 text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">My Orders</h1>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No orders yet</p>
      ) : (
        <div className="divide-y divide-border">
          {orders.map((order: MyOrder) => {
            const isExpanded = expandedId === order.orderNumber;
            // Special case: order_submitted + pay-on-delivery should show "Pending"
            const config = order.status === 'order_submitted' && order.paymentOption === 'pay-on-delivery'
              ? { label: "Pending", className: "bg-blue-100 text-blue-700 border-blue-200" }
              : statusConfig[order.status] ?? {
                  label: order.status,
                  className: "bg-secondary text-muted-foreground border-border",
                };

            return (
              <div key={order.orderNumber}>
                <button
                  onClick={() => toggleExpand(order.orderNumber)}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatOrderDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0 ${config.className}`}
                      >
                        {config.label}
                      </Badge>
                      <p className="text-sm font-medium text-foreground mt-1">
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="pb-4 pl-1 animate-fade-in space-y-2">
                    {order.orderType === 'gift_card' ? (
                      /* Gift Card Details */
                      <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Gift Card Amount</span>
                          <span className="text-foreground font-semibold">
                            {formatPrice(order.giftCardAmount || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Theme</span>
                          <span className="text-foreground capitalize">
                            {order.giftCardThemeId?.replace(/-/g, ' ') || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Recipient</span>
                          <span className="text-foreground font-medium">
                            {order.giftCardRecipientName || '—'}
                          </span>
                        </div>
                        {order.giftCardMessage && (
                          <div className="border-t border-border pt-2 mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Personal Message</p>
                            <p className="text-sm text-foreground italic">"{order.giftCardMessage}"</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Items */}
                        <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <div>
                                <p className="text-foreground">
                                  {item.productBrand} {item.productName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.variant || 'Default'} · Qty: {item.quantity}
                                </p>
                              </div>
                              <p className="text-foreground font-medium">
                                {formatPrice(item.unitPrice)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Delivery info */}
                        <div className="bg-secondary/50 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            {order.deliveryMethod === "pickup" ? (
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            ) : (
                              <Truck className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            )}
                            <div className="text-xs space-y-0.5">
                              <p className="text-foreground font-medium">{order.fullName}</p>
                              {order.deliveryMethod === "pickup" ? (
                                <>
                                  <p className="text-muted-foreground">{order.pickupStationName}</p>
                                  <p className="text-muted-foreground">{order.pickupStationAddress}</p>
                                </>
                              ) : (
                                <p className="text-muted-foreground">{order.deliveryAddress}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Action Buttons */}
                    {(order.canConfirmPayment || order.canCancel) && (
                      <div className="flex gap-2 pt-1">
                        {order.canConfirmPayment && (
                          <Button
                            variant="shop"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPayingOrder(order);
                            }}
                          >
                            Confirm Payment
                          </Button>
                        )}
                        {order.canCancel && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCancelTarget(order);
                            }}
                          >
                            Cancel Order
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Drawer */}
      <Drawer open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Cancel Order?</DrawerTitle>
            <DrawerDescription>
              Are you sure you want to cancel order {cancelTarget?.orderNumber}? This action cannot be undone.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <Button
              variant="shop"
              className="w-full h-12"
              onClick={handleCancelConfirm}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
