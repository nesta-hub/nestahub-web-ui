import { useState } from "react";
import { ArrowLeft, ChevronDown, MapPin, Truck, Package, CreditCard, Gift, Copy, Check } from "lucide-react";
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
import { cn } from "@/lib/utils";

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

const giftStatusPill: Record<string, string> = {
  order_submitted: "bg-amber-100 text-amber-800",
  payment_made: "bg-amber-100 text-amber-800",
  payment_confirmed: "bg-sky-100 text-sky-800",
  processing: "bg-sky-100 text-sky-800",
  completed: "bg-nesta-sage/15 text-nesta-sage",
  delivered: "bg-nesta-sage/15 text-nesta-sage",
  cancelled: "bg-muted text-muted-foreground",
  expired: "bg-muted text-muted-foreground",
};

function formatOrderDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface OrdersViewProps {
  onBack: () => void;
  initialOrderNumber?: string;
}

export function OrdersView({ onBack, initialOrderNumber }: OrdersViewProps) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(initialOrderNumber ?? null);
  const [cancelTarget, setCancelTarget] = useState<MyOrder | null>(null);
  const [payingOrder, setPayingOrder] = useState<MyOrder | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const copyLink = async (link: string, id: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      toast.success("Link copied");
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      toast.error("Couldn't copy");
    }
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
    <div className="px-4 pt-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          aria-label="Back"
          className="w-9 h-9 rounded-full border border-border bg-background flex items-center justify-center hover:bg-secondary/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No orders yet</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
          {orders.map((order: MyOrder) => {
            const isExpanded = expandedId === order.orderNumber;
            const isGiftCard = order.orderType === 'gift_card';
            const isBundle = order.orderType === 'bundle';

            // Special case: order_submitted + pay-on-delivery should show "Pending"
            const config = order.status === 'order_submitted' && order.paymentOption === 'pay-on-delivery'
              ? { label: "Pending", className: "bg-blue-100 text-blue-700 border-blue-200" }
              : statusConfig[order.status] ?? {
                  label: order.status,
                  className: "bg-secondary text-muted-foreground border-border",
                };

            const pillClass = giftStatusPill[order.status] ?? "bg-muted text-muted-foreground";

            return (
              <li key={order.orderNumber}>
                <button
                  onClick={() => toggleExpand(order.orderNumber)}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      isGiftCard
                        ? "bg-nesta-sage/15 text-nesta-sage"
                        : isBundle
                          ? "bg-nesta-tan/25 text-nesta-brown"
                          : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {isGiftCard ? (
                      <CreditCard className="w-4 h-4" />
                    ) : isBundle ? (
                      <Gift className="w-4 h-4" />
                    ) : (
                      <Package className="w-4 h-4" />
                    )}
                  </div>

                  {/* Order number + date */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight truncate">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatOrderDate(order.createdAt)}
                    </p>
                  </div>

                  {/* Total + status */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <p className="text-sm font-semibold tabular-nums text-foreground">
                      {formatPrice(order.totalAmount)}
                    </p>
                    {isGiftCard || isBundle ? (
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", pillClass)}>
                        {config.label}
                      </span>
                    ) : (
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-2 py-0", config.className)}
                      >
                        {config.label}
                      </Badge>
                    )}
                  </div>

                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground shrink-0 ml-1 transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {/* Animated expand */}
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-out",
                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 pt-3 space-y-2 bg-nesta-cream/40 border-t border-border">
                      {isGiftCard ? (
                        /* Gift Card Details */
                        order.giftCardOrderItems && order.giftCardOrderItems.length > 0 ? (
                          <div className="space-y-2">
                            {order.giftCardOrderItems.map((item, i) => {
                              const issuedCard = order.giftCards?.find(
                                (gc) => gc.themeId === item.themeId && gc.recipientName === item.recipientName
                              );
                              const shareableLink = issuedCard?.deliveryMethod === 'link' ? issuedCard.link : undefined;
                              return (
                              <div key={item.id} className="bg-card rounded-lg border border-border p-3 space-y-2">
                                {order.giftCardOrderItems!.length > 1 && (
                                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                    Card {i + 1} of {order.giftCardOrderItems!.length}
                                  </p>
                                )}
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Amount</span>
                                  <span className="text-foreground font-semibold">{formatPrice(item.amount)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Theme</span>
                                  <span className="text-foreground capitalize">{item.themeId.replace(/-/g, ' ')}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Delivery Mode</span>
                                  <span className="text-foreground capitalize">
                                    {item.deliveryMethod === 'whatsapp' ? 'WhatsApp' : item.deliveryMethod}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Recipient</span>
                                  <span className="text-foreground font-medium">{item.recipientName}</span>
                                </div>
                                {item.recipientEmail && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Recipient Email</span>
                                    <span className="text-foreground font-mono text-xs">{item.recipientEmail}</span>
                                  </div>
                                )}
                                {item.recipientPhone && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Recipient Phone</span>
                                    <span className="text-foreground font-mono text-xs">{item.recipientPhone}</span>
                                  </div>
                                )}
                                {(item.senderName || item.isAnonymous) && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Sender</span>
                                    <span className="text-foreground font-medium">
                                      {item.isAnonymous ? 'Anonymous' : item.senderName}
                                    </span>
                                  </div>
                                )}
                                {shareableLink && (
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                                      Gift card link (you send it)
                                    </p>
                                    <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-2">
                                      <p className="text-xs font-mono text-foreground truncate flex-1">
                                        {shareableLink}
                                      </p>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          copyLink(shareableLink, `${order.orderNumber}-${i}`);
                                        }}
                                        className="shrink-0 gap-1.5"
                                      >
                                        {copiedId === `${order.orderNumber}-${i}` ? (
                                          <Check className="w-3.5 h-3.5" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5" />
                                        )}
                                        {copiedId === `${order.orderNumber}-${i}` ? "Copied" : "Copy"}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                {item.message && (
                                  <div className="border-t border-border pt-2 mt-2">
                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Personal message</p>
                                    <p className="text-sm text-foreground italic">"{item.message}"</p>
                                  </div>
                                )}
                              </div>
                              );
                            })}
                          </div>
                        ) : (
                          // Single gift card (legacy)
                          <div className="bg-card rounded-lg border border-border p-3 space-y-2">
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
                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Personal Message</p>
                                <p className="text-sm text-foreground italic">"{order.giftCardMessage}"</p>
                              </div>
                            )}
                          </div>
                        )
                      ) : isBundle ? (
                        <>
                          {/* Bundle details */}
                          <div className="bg-card rounded-lg border border-border p-3 space-y-2">
                            {order.bundleName && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Bundle</span>
                                <span className="text-foreground font-medium">{order.bundleName}</span>
                              </div>
                            )}
                            {order.giftRecipientName && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Recipient</span>
                                <span className="text-foreground font-medium">{order.giftRecipientName}</span>
                              </div>
                            )}
                            {order.giftRecipientPhone && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Recipient Phone</span>
                                <span className="text-foreground font-mono">{order.giftRecipientPhone}</span>
                              </div>
                            )}
                            {order.giftMessage && (
                              <div className="border-t border-border pt-2 mt-2">
                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Gift Message</p>
                                <p className="text-sm text-foreground italic">"{order.giftMessage}"</p>
                              </div>
                            )}
                          </div>

                          {/* Delivery info */}
                          <div className="bg-card rounded-lg border border-border p-3">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
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
                      ) : (
                        <>
                          {/* Items */}
                          <div className="bg-card rounded-lg border border-border p-3 space-y-2">
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
                          <div className="bg-card rounded-lg border border-border p-3">
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
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
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
