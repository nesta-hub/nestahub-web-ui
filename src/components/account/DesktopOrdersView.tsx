import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Truck,
  Package,
  Sparkles,
  Gift,
  ShoppingBag,
  Check,
  Copy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyOrders, formatPrice, MyOrder, api } from "@/lib/api";
import { DesktopCheckoutPaymentView } from "@/components/checkout/DesktopCheckoutPaymentView";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getOrderStatusConfig(order: MyOrder) {
  if (order.status === "order_submitted" && order.paymentOption === "pay-on-delivery") {
    return { label: "Pending", className: "bg-blue-100 text-blue-700 border-blue-200" };
  }
  return (
    statusConfig[order.status] ?? {
      label: order.status,
      className: "bg-secondary text-muted-foreground border-border",
    }
  );
}

function orderTypeIcon(order: MyOrder) {
  if (order.orderType === "gift_card") return Sparkles;
  if (order.orderType === "bundle" || order.orderType === "custom_gift") return Gift;
  return Package;
}

interface DesktopOrdersViewProps {
  onBack: () => void;
  initialOrderNumber?: string;
}

export function DesktopOrdersView({ onBack, initialOrderNumber }: DesktopOrdersViewProps) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(initialOrderNumber ?? null);
  const [cancelTarget, setCancelTarget] = useState<MyOrder | null>(null);
  const [payingOrder, setPayingOrder] = useState<MyOrder | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => getMyOrders(session?.access_token ?? ""),
    enabled: !!session?.access_token,
  });

  const orders = data?.orders ?? [];
  const selectedOrder =
    orders.find((o) => o.orderNumber === selectedOrderNumber) ?? orders[0] ?? null;

  const handleCancelConfirm = async () => {
    if (!cancelTarget || !session?.access_token) return;
    setIsCancelling(true);
    try {
      await api.cancelOrder(cancelTarget.orderNumber, session.access_token);
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success(`Order ${cancelTarget.orderNumber} cancelled successfully`);
      setCancelTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePaymentConfirmed = () => {
    queryClient.invalidateQueries({ queryKey: ["my-orders"] });
    toast.success("Payment confirmed successfully");
    setPayingOrder(null);
  };

  const copyOrderNumber = async (orderNumber: string) => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopiedOrderNumber(orderNumber);
      toast.success("Order number copied");
      setTimeout(() => setCopiedOrderNumber(null), 1800);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  if (payingOrder && session?.access_token) {
    return (
      <DesktopCheckoutPaymentView
        orderId={payingOrder.orderNumber}
        totalAmount={payingOrder.totalAmount}
        onPaymentConfirmed={handlePaymentConfirmed}
        onBack={() => setPayingOrder(null)}
        hideGiftCardRedeem={payingOrder.orderType === "gift_card"}
        title="Complete payment"
        backLabel="Back to orders"
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Top nav */}
      <div className="border-b bg-background/80 backdrop-blur sticky top-0 z-20">
        <div className="container flex items-center h-14 gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Account
          </button>
          <span className="text-muted-foreground/40">/</span>
          <h1 className="text-base font-bold text-foreground">My Orders</h1>
        </div>
      </div>

      <div className="container py-8">
        {isLoading ? (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
            <div className="col-span-8 h-80 rounded-3xl bg-muted animate-pulse" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ShoppingBag
              className="w-12 h-12 text-muted-foreground/40 mb-4"
              strokeWidth={1.25}
            />
            <p className="text-base font-semibold text-foreground mb-1">No orders yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Your orders will appear here once you place one.
            </p>
            <Button variant="shop" onClick={() => navigate("/catalogue")}>
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Left — order list */}
            <div className="col-span-12 lg:col-span-4 space-y-2">
              {orders.map((order) => {
                const isActive =
                  (selectedOrder?.orderNumber ?? orders[0]?.orderNumber) === order.orderNumber;
                const config = getOrderStatusConfig(order);
                const Icon = orderTypeIcon(order);
                const isGiftCard = order.orderType === "gift_card";
                const isBundle =
                  order.orderType === "bundle" || order.orderType === "custom_gift";

                return (
                  <button
                    key={order.orderNumber}
                    onClick={() => setSelectedOrderNumber(order.orderNumber)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all",
                      isActive
                        ? "border-[hsl(28,32%,36%)] bg-[hsl(28,20%,96%)] shadow-sm"
                        : "border-foreground/[0.06] bg-card hover:border-foreground/20"
                    )}
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        isGiftCard
                          ? "bg-[hsl(28,40%,92%)]"
                          : isBundle
                          ? "bg-[hsl(85,20%,90%)]"
                          : "bg-secondary"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4",
                          isGiftCard
                            ? "text-[hsl(28,32%,45%)]"
                            : isBundle
                            ? "text-[hsl(85,22%,40%)]"
                            : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {order.orderNumber}
                        </p>
                        <p className="text-sm font-bold text-foreground tabular-nums shrink-0">
                          {formatPrice(order.totalAmount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-2 py-0", config.className)}
                        >
                          {config.label}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {formatOrderDate(order.createdAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right — detail panel */}
            <div className="col-span-12 lg:col-span-8">
              {selectedOrder && (
                <div className="lg:sticky lg:top-20 rounded-3xl border border-foreground/[0.07] bg-card overflow-hidden shadow-[0_4px_24px_-8px_hsl(28_25%_25%/0.12)] animate-fade-in">
                  <OrderDetail
                    order={selectedOrder}
                    onCancel={() => setCancelTarget(selectedOrder)}
                    onPay={() => setPayingOrder(selectedOrder)}
                    copiedOrderNumber={copiedOrderNumber}
                    onCopyOrderNumber={copyOrderNumber}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cancel dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="max-w-md rounded-3xl p-8 gap-0">
          <DialogHeader className="mb-5">
            <DialogTitle className="text-lg font-bold text-foreground">Cancel Order?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Are you sure you want to cancel order {cancelTarget?.orderNumber}? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Button
              variant="destructive"
              className="w-full h-12 rounded-xl"
              onClick={handleCancelConfirm}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 rounded-xl"
              onClick={() => setCancelTarget(null)}
            >
              Keep Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderDetail({
  order,
  onCancel,
  onPay,
  copiedOrderNumber,
  onCopyOrderNumber,
}: {
  order: MyOrder;
  onCancel: () => void;
  onPay: () => void;
  copiedOrderNumber: string | null;
  onCopyOrderNumber: (n: string) => void;
}) {
  const config = getOrderStatusConfig(order);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">{order.orderNumber}</h2>
            <button
              onClick={() => onCopyOrderNumber(order.orderNumber)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {copiedOrderNumber === order.orderNumber ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{formatOrderDate(order.createdAt)}</p>
        </div>
        <Badge variant="outline" className={cn("text-xs px-3 py-1 shrink-0", config.className)}>
          {config.label}
        </Badge>
      </div>

      {/* Order content */}
      {order.orderType === "gift_card" ? (
        <GiftCardDetail order={order} />
      ) : order.orderType === "bundle" || order.orderType === "custom_gift" ? (
        <BundleDetail order={order} />
      ) : (
        <ShopOrderDetail order={order} />
      )}

      {/* Action buttons */}
      {(order.canCancel || order.canConfirmPayment) && (
        <div className="flex gap-3">
          {order.canConfirmPayment && (
            <Button variant="shop" className="flex-1 h-11 font-semibold" onClick={onPay}>
              Confirm Payment
            </Button>
          )}
          {order.canCancel && (
            <Button
              variant="outline"
              className="flex-1 h-11 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              onClick={onCancel}
            >
              Cancel Order
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ShopOrderDetail({ order }: { order: MyOrder }) {
  return (
    <>
      <div className="rounded-2xl bg-secondary/40 divide-y divide-border overflow-hidden">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-start justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {item.productBrand} {item.productName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.variant || "Default"} · Qty: {item.quantity}
              </p>
            </div>
            <p className="text-sm font-semibold text-foreground tabular-nums shrink-0">
              {formatPrice(item.unitPrice)}
            </p>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3 bg-card/60">
          <span className="text-sm font-bold text-foreground">Total</span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
        {order.deliveryMethod === "pickup" ? (
          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        ) : (
          <Truck className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        )}
        <div className="text-sm space-y-0.5">
          <p className="font-semibold text-foreground">{order.fullName}</p>
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
    </>
  );
}

function BundleDetail({ order }: { order: MyOrder }) {
  return (
    <>
      <div className="rounded-2xl bg-secondary/40 divide-y divide-border overflow-hidden">
        {order.bundleName && (
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <p className="text-xs text-muted-foreground">Bundle</p>
            <p className="text-sm font-semibold text-foreground">{order.bundleName}</p>
          </div>
        )}
        {order.giftRecipientName && (
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <p className="text-xs text-muted-foreground">Recipient</p>
            <p className="text-sm font-semibold text-foreground">{order.giftRecipientName}</p>
          </div>
        )}
        {order.giftRecipientPhone && (
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <p className="text-xs text-muted-foreground">Recipient Phone</p>
            <p className="text-sm font-semibold text-foreground font-mono">{order.giftRecipientPhone}</p>
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-3 bg-card/60">
          <span className="text-sm font-bold text-foreground">Total</span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </div>

      {order.giftMessage && (
        <div className="bg-secondary/40 rounded-2xl px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1">Gift Message</p>
          <p className="text-sm italic text-foreground leading-relaxed">"{order.giftMessage}"</p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="text-sm space-y-0.5">
          <p className="font-semibold text-foreground">{order.fullName}</p>
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
    </>
  );
}

function GiftCardDetail({ order }: { order: MyOrder }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(id);
      toast.success("Link copied!");
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    });
  };

  if (order.giftCardOrderItems && order.giftCardOrderItems.length > 0) {
    return (
      <div className="space-y-3">
        {order.giftCardOrderItems.map((item, i) => {
          const issuedCard = order.giftCards?.find(
            (gc) => gc.themeId === item.themeId && gc.recipientName === item.recipientName
          );
          const shareableLink = issuedCard?.deliveryMethod === 'link' ? issuedCard.link : undefined;
          return (
          <div key={item.id} className="rounded-2xl bg-secondary/40 p-4 space-y-2">
            {order.giftCardOrderItems!.length > 1 && (
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Card {i + 1} of {order.giftCardOrderItems!.length}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Amount" value={formatPrice(item.amount)} />
              <InfoCard label="Theme" value={item.themeId.replace(/-/g, " ")} />
              <InfoCard label="Recipient" value={item.recipientName} />
              {item.deliveryMethod && (
                <InfoCard
                  label="Delivery Mode"
                  value={item.deliveryMethod === 'whatsapp' ? 'WhatsApp' : item.deliveryMethod}
                />
              )}
              {(item.senderName || item.isAnonymous) && (
                <InfoCard
                  label="Sender"
                  value={item.isAnonymous ? 'Anonymous' : (item.senderName ?? '')}
                />
              )}
            </div>
            {item.recipientEmail && (
              <div className="bg-card rounded-xl px-3 py-2.5 mt-1">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Recipient Email</p>
                <p className="text-sm font-mono text-foreground mt-0.5">{item.recipientEmail}</p>
              </div>
            )}
            {item.recipientPhone && (
              <div className="bg-card rounded-xl px-3 py-2.5 mt-1">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Recipient Phone</p>
                <p className="text-sm font-mono text-foreground mt-0.5">{item.recipientPhone}</p>
              </div>
            )}
            {shareableLink && (
              <div className="mt-1">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                  Gift card link (you send it)
                </p>
                <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-2">
                  <p className="text-xs font-mono text-foreground truncate flex-1">{shareableLink}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyLink(shareableLink, `${order.orderNumber}-${i}`)}
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
              <div className="bg-card rounded-xl px-3 py-2.5 mt-1">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Message</p>
                <p className="text-sm italic text-foreground mt-0.5">"{item.message}"</p>
              </div>
            )}
          </div>
          );
        })}
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-card border border-border">
          <span className="text-sm font-bold text-foreground">Total</span>
          <span className="text-lg font-bold text-foreground tabular-nums">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-secondary/40 divide-y divide-border overflow-hidden">
      <div className="grid grid-cols-2 gap-3 p-4">
        <InfoCard label="Amount" value={formatPrice(order.giftCardAmount || 0)} />
        <InfoCard label="Theme" value={order.giftCardThemeId?.replace(/-/g, " ") || "—"} />
        <InfoCard label="Recipient" value={order.giftCardRecipientName || "—"} />
      </div>
      {order.giftCardMessage && (
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1">Personal message</p>
          <p className="text-sm italic text-foreground">"{order.giftCardMessage}"</p>
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-3 bg-card/60">
        <span className="text-sm font-bold text-foreground">Total</span>
        <span className="text-lg font-bold text-foreground tabular-nums">
          {formatPrice(order.totalAmount)}
        </span>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5 capitalize">{value}</p>
    </div>
  );
}
